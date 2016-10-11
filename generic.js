angular.module('metrics', [])

.controller('metricsCtrl', ['$scope', 'objectTools', 'configService', 
                               '$controller', '$timeout', '$attrs', 'uesPanelButtons',
                               'userLoginService', 'dataSelectorService', 'metricsService',
                                      function($scope, oTools, config, 
                                    		  $controller, $timeout, $attrs, buttons, 
                                    		  login, dataSelect, dataService){
	
	$scope.gridView = false;
	$scope.view = "loading";
	
	var ssFunc = $attrs.ssFunc;
	
	/*siteReq is a query string that is dynamically built by the dataSelectorService. 
	   It becomes an argument to the charts endpoint function which determines
	   which buildings to display data for.
	*/
	var defaultConfig = {
			dateRange:{
				from: $attrs.defaultDate.from,
				to: $attrs.defaultDate.to
			},
			siteReq: ""
	};
	
	var me = this;
	angular.extend(me, config, buttons, dataSelect);

	$scope.config = me.getConfig();
	
	me.setConfig(defaultConfig);
	
	me.createGridViewIcon();
	me.createDownloadIcon(dloadFn);
	me.createImgSaveIcon(saveImgFn);
	me.createBackButton();
	
	/*fields and columns for generic data table*/ 
	$scope.genFields = {};
	$scope.genColumns = [];
	
	function makeChart(res){
		
		var data = res.rows;
		var cols = res.cols;
	    var meta = res.meta;
	    
	    $scope.genFields = getGenFields(cols);
	    $scope.genColumns = getGenColumns(cols);
	    
	    $('#chart').kendoChart({
	    	dataSource: {
	    		data: data
	    	},
	    	seriesDefaults: {
	    		type: "column"
	    	},
	    	series: getSeries(cols),
	    	categoryAxis:{
	    		categoryField: "site",  //can wrap this in response meta..makes reusable
	    		categories: getCategories(data),
	    		labels:{
	    			visible: true,
	    			rotation: -80
	    		},
	    		majorGridLines:{
	    			visible:false
	    		}
	    	},
	    	tooltip:{ //tooltip handling may have to be case by case.  leaving this undone
	    		visible:true,
	    		template : $attrs.tooltipFn
	    	},
	    	legend:{
	    		position:"top"
	    	},
	    	valueAxis: meta.valueAxis || {} 
	    })
	};
	
	function getCategories(data){
		var rtnObj = [];
		for(i in data){
			rtnObj.push(dataService.formatCatAxis(data[i].site, $attrs.singleLine))
		}
		return rtnObj
	}
	
	function getSeries(cols){
		var rtnObj = [];
		for(i in cols){
			if(cols[i].name !== "site"){
				rtnObj.push({
					"field" : cols[i].name,
					"name" : cols[i].title,
					"color" : cols[i].color
				});
			}
		}
		return rtnObj
	};
	
	function getGenColumns(cols){
		var rtnObj = [];
		for(i in cols){
			rtnObj.push({
				field :  cols[i].name,
				format : cols[i].format !== undefined ? cols[i].format +" "+ cols[i].unit : undefined,
				title : cols[i].title
			});
		}
		return rtnObj
	};
	function getGenFields(cols){
		var rtnObj = {};
		for(i in cols){
			rtnObj[cols[i].name] = {type: cols[i].type}
		}
		return rtnObj
	};

	function saveImgFn(){
		angular.element("#chart").data().kendoChart.exportImage().done(function(data) {
			kendo.saveAs({
				dataURI: data,
				fileName: $attrs.fileName+".png"
			});
		});
	};
	
	function dloadFn(download){
		var data = $scope.data.rows;
		var cols = $scope.data.cols;
		var rtnObj = {};
		var csvArray = data.map(function(d){
			rtnObj = {};
			for(i in cols){
				if(download === false) {rtnObj[cols[i].name] = d[cols[i].name];}
				else {rtnObj[cols[i].title] = d[cols[i].name];}
			}
			return rtnObj;
		})
		if(download === false){ 
			return csvArray;
		}
		else{
			oTools.downloadArrayAsCsv(csvArray, $attrs.fileName + ".csv");
		}
	};
	
	function error(err){
		$scope.view = Object.prototype.toString.call(err) === '[object Array]' ? 'no data' : 'error';
		console.log("err", err);
		$scope.$apply();
	};
	
	var initialized;
	
	function prepForRequest(){
		$scope.view = "loading";
		
		if($scope.config.siteReq != "" && 
				$scope.config.dateRange.from != null && 
				$scope.config.dateRange.to != null && 
				$scope.config.dateRange.from < $scope.config.dateRange.to){
			
			var confObj = initialized ? $scope.config : (function(){initialized = true; return "";})()
			
			if(typeof(confObj) == 'object' && !dsChanged){
				confObj.siteReq = null;
			}
					
			dataService.getMetricData(confObj, ssFunc).then(function(res){
				$scope.gridView = false;
				$scope.data = res;
				$scope.view = "done";
				$scope.$apply();
				$timeout(makeChart(res));
			}, error);
		}
	};

	var dsChanged = false;
	
	$scope.$watch(me.getSiteRequestString, function(nu){
		if(initialized){dsChanged = true;}
		   $scope.config.siteReq = nu;
	 });
	
	$scope.$watch('config', prepForRequest, true);

	$scope.$on('grid-view', function(){
		$timeout(function(){
			$scope.$apply()
		});
		$scope.gridView = !$scope.gridView;
		if(!$scope.gridView){
			return;
		}
		$scope.chartData = dloadFn(false);
	});
	$(window).on('resize', function() {
	 	kendo.resize($('#chart'));
 	});
}])

.factory('metricsService', ['ourAPI', function(ourApi){
	var _servObj = {};
	var	_getMetricData = function(_config, ssFunc){
		return ourApi.expr(ssFunc+"("+getConfigString(_config)+")", true)
	}
	
	function getDateString(dateObj){
		return "dateRange:"+kendo.toString(dateObj.from,"yyyy-MM-dd")+'..'+kendo.toString(dateObj.to,"yyyy-MM-dd")+",";
	}
	
	function getConfigString(configObj){
		var configStr = "";
		
		if(typeof(configObj) === "object"){
			for(var key in configObj){
				configStr += key == "dateRange" ? getDateString(configObj[key]) : key+":"+configObj[key]+","
			}
			
			configStr = "{"+configStr.substring(0,configStr.lastIndexOf(","))+"}"
		}else{
			configStr = configObj;
		}
		
		return configStr;
	}
	
	var _formatCatAxis = function(s, singleLine){
		
		var returnStr = "";
		if(!singleLine && s.length > 20){
			s = s.split(" ");
			while(s.length > 1){
				if(s[0].length+s[1].length < 20){ // if the next two segments are less than two characters, join them until they're not
					s[0] = s[0]+" "+s[1]
					s.splice(1,1);
				}
				else{
					returnStr += s.splice(0,1)[0]+"\n"; // once they're not, move it to the returnString separated by a new character
				}
			}
			
			if(s[0].length > 20){
				returnStr += "\n"+s[0]
			}else{
				returnStr += " "+s[0];
			}
		}else{
			returnStr = s;
		}
		return returnStr;
	}
	_servObj = {
			formatCatAxis:_formatCatAxis,
			getMetricData:_getMetricData
	}
	return _servObj
}])


.directive('directiveOne', [function(){
     return{
         restrict: 'E',
         controller: 'metricsCtrl',
         templateUrl: 'views/metrics.html',
         scope:{},
         compile:function(elem, attrs){
        	 attrs.ssFunc = "directiveOneFn";
        	 attrs.fileName = "Directive_One";
        	 attrs.tooltipFn = function(rec){return rec.category+"<br>"+kendo.toString(rec.value,'n2')+"% of things directive one quantifies shown when user hovers over chart"}
        	 attrs.singleLine = true;
        	 attrs.defaultDate = {
        			 from:new Date(new Date().getFullYear(), new Date().getMonth()-1, new Date().getDate(),0,0,0,0),
        			 to:new Date()
        	 }
         }
     }
}])

.directive('directiveTwo', [function(){
     return{
         restrict: 'E',
         controller: 'metricsCtrl',
         templateUrl: 'views/metrics.html',
         scope:{},
         compile:function(elem, attrs){
        	 attrs.ssFunc = "directiveTwoFn";
        	 attrs.fileName = "Directive_Two";
        	 attrs.defaultDate = {
        			 from:new Date(new Date().getFullYear(), new Date().getMonth()-1, new Date().getDate(),0,0,0,0),
        			 to:new Date()
        	 }
         }
     }
}])

