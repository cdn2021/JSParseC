
var JsParseC = {};
var _fjpc = {};
JsParseC.config = {};
JsParseC.initConfig = function(config) {
	//配置文件
	if (typeof(config) != "object")
		config = {};
	//如果传入参数不是对象，重设为空对象
	if (typeof(JsParseC.config.initConfig) == "undefined") {
		//初始化配置器
		JsParseC.config.initConfig = {};
		JsParseC.config.initConfig["stdin"] = function (e) { return Math.random(); };
		JsParseC.config.initConfig["stdout"] = console.log;
		JsParseC.config.initConfig["stderr"] = console.log;
		//默认将stdin设为随机数，stdout和stderr设为控制台输出
		JsParseC.config.initConfig.debugger = console.log;
	};
	for (var index in config) {
		//遍历对象，将用户传入的配置写入配置文件
		JsParseC.config.initConfig[index] = config[index];	
	};
	return true;
};
JsParseC.run = function(content,debug = false) {
	//解析C语言程序发起函数
	
	var preprocess_content = JsParseC.preprocess(content);
	if (debug)
		JsParseC.config.initConfig.debugger("Preprocess the file.",{varible_address:window.jspc_ppr});
	//预处理文件
	window.jspc_ppr = preprocess_content;
	var word_analysis_content = JsParseC.word_assay(preprocess_content);
	if (debug)
		JsParseC.config.initConfig.debugger("assay the word of the file.",{varible_address:window.jspc_wac});
	//词法分析文件
	window.jspc_wac = word_analysis_content;
	var execute_code = JsParseC.grammar_assay(word_analysis_content);
	if (debug)
		JsParseC.config.initConfig.debugger("assay the grammar of the file.",{varible_address:window.jspc_gac});
	//语法分析文件
	window.jspc_gac = execute_code;
	//执行代码
	JsParseC.executor(execute_code,debug);
};
JsParseC.preprocess = function(content) {
	//C语言预处理程序
	content = content.replaceAll(/\/\*(\s|.)*?\*\//gim," ");
	//替换掉多行注释
	var content_array = content.split("\n");
	//以换行符为分隔
	var i = 0;
	var exp = new RegExp("/{2,}.*");
	while (i < content_array.length) {
		//循环，处理
		if (content_array[i][content_array[i].length] == "\") {
			//把物理行转成逻辑行
			content_array[i-1] += content_array[i];
			content_array[i] = "";
		};	
		content_array[i] = content_array[i].replaceAll(exp," ");
		//替换掉单行注释
	};
	var result = "";
	var i = 0;
	while (i < content_array.length) { 
		//拼接数组成字符串
		result += content_array[i];
	};
	return result;
};
function _Fjpc_Varible(type,value) {
	//实现C变量类型
	if (typeof(type) == "undefined") {
		//当传入的变量为空时，抛出错误
		throw("The variable type is not recognized");
		return;
	};
	//识别变量类型
	this.type = type;
	switch(type) {
		case "int":
		case "unsigned int":
			this.size = 16;
		//整数大小16位
			break;
		case "float":
		case "unsigned float":
			this.size = 32;
		//浮点数大小32位
			break;
		case "double float":
		case "unsigned double float":
			this.size = 64;
		//双浮点数大小64位
			break;
		case "char":
			this.size = 8;
		//字符大小8位
			break;
		case "short int":
		case "unsigned short int":
			this.size = 8;
		//小整数大小8位
			break;
		case "long int":
		case "unsigned long int":
			this.size = 32;
		//长整数大小32位
			break;
		case "long long int":
		case "unsigned long long int":
			this.size = 48;
		//超长整数大小48位
			break;
		default:
			//默认抛出错误
			throw("The variable type is not recognized");
			return;
	};
	this.value = new Uint8Array(this.size / 8);
	//申请一个二进制数组
	if (this.value.length != (this.size / 8)) {
		throw("Cannot request the memory.");
		return;
	};
	this.defined = false;
	this.set = function (value) {
		this.defined = true;
		if (this.type.indexOf("int") != -1) {
			//变量类型为整数
			if (typeof(value) != "number" || parseInt(value) != value) {
				//变量类型不匹配
				throw("The variable types do not match");
				return;
			};
			if (this.type.indexOf("unsigned") == -1) {
				//有符号整数处理
				value %= Math.pow(2,this.size)+1;
				if (value > (Math.pow(2,this.size-1))-1) {
					//Overflow
					let difference = value - Math.pow(2,this.size-1) + 1;
					value = -Math.pow(2,this.size-1) + difference;
				};
				if (value < -(Math.pow(2,this.size-1))+1) {
					//Overflow
					let difference = -Math.pow(2,this.size-1) + 1 - value;
					value = Math.pow(2,this.size-1) - difference;
				};
			} else {
				//无符号整数处理
				value = Math.abs(value);
			};
			var bin = value.toString(2);
			//把值转成二进制
			while (bin.length < this.size+1) {
				bin = "0" + bin;
				//如果二进制位不足时，自动在前面补0
			};
			if (this.type.indexOf("unsigned") == -1) {
				//有符号整数符号处理
					if (bin.indexOf("-") != -1) {
					//toString(2)方法不会转换负数，会在二进制码中把负号也一起带上，当二进制码中包含负号时，删除负号，设置最高位为1
					bin = bin.replaceAll("-","");
					let bin_array = bin.split("");
					//把二进制字符串拆成数组
					bin_array[0] = "1";
					var index = 0;
					bin = "";
					while (index < bin_array.length) {
						//把数组拼接成字符串
						bin = bin.concat("",bin_array[index]);
						index++;
					};
				} else {
					//当二进制码中不包含负号时，设置最高位为0
					let bin_array = bin.split("");
					//把二进制字符串拆成数组
					bin_array[0] = "0";
					var index = 0;
					bin = "";
					while (index < bin_array.length) {
						//把数组拼接成字符串
						bin = bin.concat("",bin_array[index]);
						index++;
					};
				};
			};
			if (bin.length > this.size) {
				//二进制位数过大时，抛弃高位
				bin = bin.substring(bin.length - this.size);
			};
		
		};
		if (this.type == "char") {
			//变量类型为字符
			if (typeof(value) != "string") {
				//变量类型不匹配
				throw("The variable types do not match");
				return;
			};
			if (value.length != 1) {
				//变量长度不为1
				throw("Stack overflow");
				return;
			};
			let ascii_code = value.charCodeAt();
			var bin = ascii_code.toString(2);
			//把值转成二进制
			while (bin.length < this.size) {
				bin = "0" + bin;
				//如果二进制位不足时，自动在前面补0
			};
			if (bin.length > this.size) {
				//二进制位数过大时，抛弃高位
				bin = bin.substring(bin.length - this.size);
			};
		};
		if (this.type == "float" || this.type == "unsigned float") {
			//变量类型为浮点数
			if (typeof(value) != "number") {
				//变量类型不匹配
				throw("The variable types do not match");
				return;
			};
			if (this.type == "unsigned float") {
			//无符号单精度浮点数
			value = Math.abs(value);
			};
			var sign_bit = (value>=0)?0:1;
			//符号位
			var tmp_bin = value.toString(2);
			//值转成二进制
			var point_position = tmp_bin.indexOf(".");
			if (tmp_bin == "0") {
				//值为0
				var power_position = "00000000";
				//指数为0
				var num = "00000000000000000000000";
				//尾数为0
			}
			var bin = sign_bit + power_position + num;
			bin = bin.replaceAll(".","");
		
		};
		if (this.type == "double float" || this.type == "unsigned double float") {
			//变量类型为双精度浮点数
			if (typeof(value) != "number") {
				//变量类型不匹配
				throw("The variable types do not match");
				return;
			};
			if (this.type == "unsigned float") {
				//无符号双精度浮点数
				value = Math.abs(value);
			};
			var sign_bit = (value>=0)?0:1;
			//符号位
			var tmp_bin = value.toString(2);
			//值转成二进制
			var point_position = tmp_bin.indexOf(".");
			//定位小数点
			if (point_position == -1) {
				//无小数点
				var power_position = 127;
				power_position = power_position.toString(2);
				//设置偏移指数为127（默认）
				var num = tmp_bin.substring(0,47);
				//截取55位尾数
				while (num.length < 56)
					num += "0";
				//不足55位填充为55位
			} else {
				var first_real_number = tmp_bin.indexOf("1");
				//得到第一个有效数字位置(第一个1)
				if (first_real_number == -1) {
					//没有有效数字
					var power_position = 127;
					power_position = power_position.toString(2);
					//设置偏移指数为127（默认）
					var num = "";
					while (num.length < 56)
						num += "0";
					//55位尾数设置为0
				} else {
					var difference = point_position - first_real_number - 1;
					//得到偏移量
					var power_position = 127 + difference;
					power_position = power_position.toString(2);
					//偏移指数=127+偏移量
					var num = tmp_bin.substring(first_real_number-1).substring(0,23);
					num.replaceAll(".","");
					//截取55位尾数	
					while (num.length < 56)
						num += "0";
					//不足55位填充为55位
				};
			};
			var bin = sign_bit + power_position + num;
			bin = bin.replaceAll(".","");
		
		};
		var index = 0;
		while (index < bin.length) {
			//将二进制字符串赋成ArrayBuffer
			this.value[index/8] = parseInt(bin.substring(index,index+8),2);
			index += 8;
		};
		_fjpc.memory[this.address] = this;
		return this;
	};
	if (typeof value != "undefined") {
		//当值有意义时，赋值
		this.set(value);
	};
	this.address = _fjpc.currentAddress;
	_fjpc.currentAddress += this.size / 8;
	_fjpc.memory[this.address] = this;
	return _fjpc.memory[this.address];
};
function _Fjpc_Array(type,array_size) {
	//实现C数组类型
	if (typeof(type) == "undefined" || typeof(array_size) == "undefined") {
		//当传入的变量为空时，抛出错误
		throw("The variable is empty");
		return;
	};
	//识别变量类型
	this.type = type;
	switch(this.type) {
		case "int":
		case "unsigned int":
			this.size = 16;
		//整数大小16位
			break;
		case "float":
		case "unsigned float":
			this.size = 32;
		//浮点数大小32位
			break;
		case "double float":
		case "unsigned double float":
			this.size = 64;
		//双浮点数大小64位
			break;
		case "char":
			this.size = 8;
		//字符大小8位
			break;
		case "short int":
		case "unsigned short int":
			this.size = 8;
		//小整数大小8位
			break;
		case "long int":
		case "unsigned long int":
			this.size = 32;
		//长整数大小32位
			break;
		case "long long int":
		case "unsigned long long int":
			this.size = 48;
		//超长整数大小48位
			break;
		default:
			//默认抛出错误
			throw("The variable type is not recognized");
			return;
	};
	try {
		this.value = [];
		var index = 0;
		while (index < array_size) {
			//循环生成变量
			this.value[index] = new _Fjpc_Varible(this.type,this.default_value);
			index++;
		};
		//设置大小
		this.size *= this.value.length
		//以第一项地址作为数组地址
		this.address = this.value[0].address;
	} catch (err) {
		throw(err);
		return;
	};
	return this;
};
_fjpc.currentAddress = 0;
_fjpc.memory = [];
JsParseC.version = 1.0;
if (typeof($) == "undefined")
	var $ = JsParseC;
var jpc = JsParseC;
JsParseC.initConfig();
