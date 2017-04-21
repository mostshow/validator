# validate.js

validate是一个轻量级javascript验证库

## Features

- 配置规则
- 实时验证用户输入数据
- 自定义信息
- 支持验证回调

## How to use

```javascript

  var passwordValidator = validator('.item-wrap', [{
      name: 'password',
      display: '密码',
      rules: 'required'

  },{
      name: 'confirmPassword',
      display: '确认密码',
      rules: 'required|matches[password]'

  }], function(errors) {
        if (errors.length > 0) {
             //Show the errors
        }
    }
  )
  if(passwordValidator.validate()){
      return;
  }
```




