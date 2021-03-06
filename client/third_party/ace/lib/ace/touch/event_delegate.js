/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

define(function(require, exports, module) {

var util = require('./util');
 
function add(self, original, listen, scope, name) {

  if (original) {

    self._event || (self._event = {
        sender: self.sender,
        type: self.type,
        returnValue: true,
        delegate: self
    });

    var listens = self.listens || (self.listens = []);

  	if(typeof scope == 'string'){
  		name = scope;
  		scope = self._event.sender;
  	}
  	else{
  		scope || (scope = self._event.sender);
  		name || (name = util.guid());
  	}

    var len = listens.length;

    if(len){

      for (var i = 0; i < len; i++) {

        var item = listens[i];

        if (item.original === original && item.scope === scope) {
          return;
        }

        if (item.name == name) {
            item.original = original;
            item.listen = listen;
            item.scope = scope;
          return;
        }
      }
    }

    listens.splice(0, 0, {
      original: original,
      listen: listen,
      scope: scope,
      name: name
    });

    self.length = listens.length;
    self.emit = emit;
  }
  else{
    throw new Error('Listener function can not be empty');
  }
}

function emit(data) {

  var listens = this.listens;
  var event = this._event;
  event.data = data;
  event.returnValue = true;

  for (var i = this.length - 1; i > -1; i--) {
    var item = listens[i];
    item.listen.call(item.scope, event);
  }
  return event.returnValue;
}

function empty_emit() {
  return true;
}


/**
 * @class EventDelegate event delegate
 */
var EventDelegate = util.class({

  //private:
  _event: null,
  
  /**
   * 是否已经启用
   * @private
   */
  _enable: true,

  //public:
  /**
   * 事件侦听列表
   * @type {Array}
   */
  listens: null,

  /**
   * 事件类型
   * @type {String}
   */
  type: '',

  /**
   * 事件发送者
   * @type {Object}
   */
  sender: null,

  /**
   * 添加的事件侦听数量
   * @type {Number}
   */
  length: 0,

  /**
   * 构造函数
   * @constructor
   * @param {String} type   事件类型标示
   * @param {Object} sender 事件发起者
   */
  constructor: function(type, sender) {
    this.type = type;
    this.sender = sender || null;
  },

  /**
   * 绑定一个事件侦听器(函数)
   * @param {Function} listen               侦听函数
   * @param {Object}   scope     (Optional) 重新指定侦听函数this
   * @param {name}     name      (Optional) 侦听器别名,在删除时,可直接传入该名称
   */
  on: function(listen, scope, name) {
    add(this, listen, listen, scope, name);
  },

  /**
   * 绑定一个侦听器(函数),且只侦听一次就立即删除
   * @param {Function} listen               侦听函数
   * @param {Object}   scope     (Optional) 重新指定侦听函数this
   * @param {name}     name      (Optional) 侦听器别名,在删除时,可直接传入该名称
   */
  once: function(listen, scope, name) {
    var self = this;
    add(this, listen, {
      call: function(scope, evt) {
        self.unon(listen, scope);
        listen.call(scope, evt);
      }
    },
    scope, name);
  },

  /**
   * Bind an event listener (function),
   * and "on" the same processor of the method to add the event trigger to receive two parameters
   * @param {Function} listen               侦听函数
   * @param {Object}   scope     (Optional) 重新指定侦听函数this
   * @param {name}     name      (Optional) 侦听器别名,在删除时,可直接传入该名称
   */
  $on: function(listen, scope, name) {
    add(this, listen, {
      call: listen
    },
    scope, name);
  },

  /**
   * Bind an event listener (function), And to listen only once and immediately remove
   * and "on" the same processor of the method to add the event trigger to receive two parameters
   * @param {Function} listen               侦听函数
   * @param {Object}   scope     (Optional) 重新指定侦听函数this
   * @param {name}     name      (Optional) 侦听器别名,在删除时,可直接传入该名称
   */
  $once: function(listen, scope, name) {
    var self = this;
    add(this, listen, {
      call: function(scope, evt) {
        self.unon(listen, scope);
        listen(scope, evt);
      }
    },
    scope, name);
  },

  /**
   * 卸载侦听器(函数)
   * @param {Object} listen (Optional) 可以是侦听函数,也可是观察者别名,如果不传入参数卸载所有侦听器
   * @param {Object} scope  (Optional) scope
   */
  off: function(listen, scope) {
    
    var ls = this.listens;
    if (!ls) return;

    if (listen) {
      var key = typeof listen == 'function' ? 'original': 'name';

      for(var i = ls.length - 1; i > -1; i--){
        var item = ls[i];
        if(item[key] === listen && (!scope || item.scope === scope)){
          ls.splice(i, 1);
        }
      }

      this.length = this.listens.length;

      if (!this.length) this.emit = empty_emit;
    }
    else {
      this.listens = null;
      this.length = 0;
      this.emit = empty_emit;
    }
  },
  
  /**
   * 卸载侦听器
   */
  unon: function(listen, scope){
    this.off(listen, scope);
  },
  
  /**
   * 获取是否已经启用
   * @type {Boolean}
   */
  get enable(){
    return this._enable;
  },

  /**
   * 设置启用禁用
   * @type {Boolean}
   */
  set enable(value){

    if(value){
      this._enable = true;
      if(this.length){
        this.emit = emit;
      }
      else{
        this.emit = empty_emit;
      }
    }
    else{
      this._enable = false;
      this.emit = empty_emit;
    }
  },
  
  /**
   * 通知所有侦听器
   * @param  {Object} data 要发送的数据
   * @return {Object}
   */
  notice: function(data){
    return this.emit(data);
  },
  
  emit: empty_emit,

  /**
   * 设置为外壳代理
   * @param {tesla.Delegate}
   */
  shell: function(del){
    var self = this;
    del.on(function(evt){
      evt.returnValue = self.emit(evt.data);
    });
  }
});

exports.EventDelegate = EventDelegate;

});