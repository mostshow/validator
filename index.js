

var $ = require("jquery");

;(function(window, document, undefined){

    var defaults = {
        messages: {
            required: '%s不能为空.',
            matches: '两次密码输入不一致.',
            sixNum: '%s为6位阿拉伯数字.'
        },
        callback: function(errors) {

        },
        errHandle: function(field,errorObject){

            var errHtml = '<i class="error-icon"></i>%s'.replace('%s', errorObject.message)
            var $el = field.element;
            $el.closest('.line').removeClass('succeed').addClass('error').find('.errorTips').html(errHtml)
        },
        sucessHandle: function(field){

            var $el = field.element;
            $el.closest('.line').removeClass('error').addClass('succeed')
        }

    };

    var ruleRegex = /^(.+?)\[(.+)\]$/;

    function Validator(formNameOrNode, fields, callback){

        return new Validator.prototype.init(formNameOrNode, fields, callback);

    }

    Validator.prototype = {

        // var passwordValidator = validator('.item-wrap', [{
        //     name: 'password',
        //     display: '密码',
        //     rules: 'required'

        // },{
        //     name: 'confirmPassword',
        //     display: '确认密码',
        //     rules: 'required|matches[password]'

        // }
        // ])
        init: function(node, fields, options){

            var options = options || {}
            this.callback = options.callback || defaults.callback;
            this.errHandle = options.errHandle || defaults.errHandle;
            this.sucessHandle = options.sucessHandle || defaults.sucessHandle;

            this.errors = [];
            this.fields = {};
            this.$node = $(node);
            this._id = 10000;

            for (var i = 0, fieldLength = fields.length; i < fieldLength; i++) {
                var field = fields[i];

                if (field.names) {
                    for (var j = 0, fieldNamesLength = field.names.length; j < fieldNamesLength; j++) {
                        this._addField(field, field.names[j]);
                    }
                } else {
                    this._addField(field, field.name);
                }
            }

            this.validateDelegate();
            return this
        },

        _hooks:{
            required: {
                validate: function(field){

                    if ((field.type === 'checkbox') || (field.type === 'radio')) {
                        return (field.checked === true);
                    }

                    return (field.value !== null && field.value !== '');
                }
            },
            sixNum: {
                validate: function(field){

                    return (/^\d{6}$/.test(field.value) );
                },
                instructions:null

            },
            matches: {
                validate: function(field, matchName) {
                    var el = this.$node.find('input[name="'+matchName+'"]');

                    if (el) {
                        return field.value === el.val();
                    }

                    return false;
                }
            }
        },

        _addField: function(field, nameValue)  {
            var $el = this.$node.find('input[name="'+nameValue+'"]');
            this.fields[nameValue] = {
                name: nameValue,
                display: field.display || nameValue,
                rules: field.rules,
                depends: field.depends,
                id: this.attributeValue($el[0], 'id')||this._id++,
                element: $el,
                type: this.attributeValue($el[0], 'type'),
                value: this.attributeValue($el[0], 'value'),
                checked: this.attributeValue($el[0], 'checked')
            };
        },

        attributeValue: function (element, attributeName) {
            var i;

            if ((element.length > 0) && (element[0].type === 'radio' || element[0].type === 'checkbox')) {
                for (i = 0, elementLength = element.length; i < elementLength; i++) {
                    if (element[i].checked) {
                        return element[i][attributeName];
                    }
                }

                return;
            }

            return element[attributeName];
        },
        validateDelegate: function(){

            for (var key in this.fields) {
                if(this.fields.hasOwnProperty(key)){
                    var field = this.fields[key];
                    field&&this.delegate(field);
                }
            }

        },

        delegate: function(field) {
            var ctx = this, $el = field.element;
            $el.on(' focusout keyup',function(evt){//focusin

                ctx._removeErr(field)
                field.value = ctx.attributeValue($el[0], 'value');
                field.checked = ctx.attributeValue($el[0], 'checked');
                ctx._validateField(field);

            })

        },

        validate: function(){
            var i,msg,type,checker,result_ok;
            this.errors = [];
            for (var key in this.fields) {
                if(this.fields.hasOwnProperty(key)){
                    var field = this.fields[key] || {};
                    $el = field.element;
                    field.value = this.attributeValue($el[0], 'value');
                    field.checked = this.attributeValue($el[0], 'checked');

                    this._validateField(field);
                }
            }

            this._callback();
            return this.hasErrors();
        },

        _callback: function(){
            if (typeof this.callback === 'function') {
                this.callback(this.errors);
            }
        },

        _validateField: function(field){
            //todo 非必选字段验证
            var i, j,rules = field.rules.split('|'), passFlag = true
            ,indexOfRequired = field.rules.indexOf('required')
            ,isEmpty = (!field.value || field.value === '' || field.value === undefined)
            ,errors = this.errors;
            for (i = 0, ruleLength = rules.length; i < ruleLength; i++) {
                var method = rules[i], param = null,failed = false, parts = ruleRegex.exec(method),checker;
                if (indexOfRequired === -1 && isEmpty) {
                    continue;
                }
                if (parts) {
                    method = parts[1];
                    param = parts[2];
                }
                checker = this._hooks[method];
                if(!checker){
                    throw{
                        name:'ValidationError',
                        messages:'No handler to validate type '+ type
                    };
                }
                if (!checker.validate.apply(this, [field, param])) {
                    failed = true;
                }
                if (failed) {
                    var source = checker.instructions || defaults.messages[method],
                        message = '';
                        passFlag = false;
                        if (source) {
                            message = source.replace('%s', field.display);

                            if (param) {
                                message = message.replace('%s', (this.fields[param]) ? this.fields[param].display : param);
                            }
                        }

                        var existingError;
                        for (j = 0; j < errors.length; j += 1) {
                            if (field.id === errors[j].id) {
                                existingError = errors[j];
                            }
                        }

                        var errorObject = existingError || {
                            id: field.id,
                            display: field.display,
                            element: field.element,
                            name: field.name,
                            message: message,
                            messages: [],
                            rule: method
                        };
                        errorObject.messages.push(message);
                        if (!existingError) errors.push(errorObject);
                        this.errHandle(field, errorObject)
                        return ;

                }else{
                    this.sucessHandle(field)

                }
            }

            // for (j = 0; j < errors.length; j += 1) {
            //     if (field.id === errors[j].id ) {
            //         this.errHandle(field)
            //     }
            // }
        },

        _removeErr: function(field){
            var errors = this.errors;
            for (j = 0; j < errors.length; j += 1) {
                if (field.id === errors[j].id) {
                    errors.splice(j, 1);
                }
            }
        },

        errHandle: function(field){

        },

        sucessHandle: function(field){

        },

        hasErrors:function(){
            return this.errors.length !== 0;
        }

    }

    Validator.rules = Validator.prototype._hook;

    Validator.prototype.init.prototype = Validator.prototype;

    window.validator = Validator;

    if (typeof module !== 'undefined' && module.exports) {

        module.exports = Validator;

    }
})(window, document)





