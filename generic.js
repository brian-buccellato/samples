angular.module('metrics', [])

.controller('genericCtrl', ['$scope', '$controller', '$timeout', '$attrs', 'genericService',
                                      function($scope, $conroller, $timeout, $attrs, genericService){
	
	/*
		TODO
		make this work with d3.js?
		write service to pick data end point
		write fake data files
		write a grid view type of thing. 
	*/
	
}])

.factory('genericService', ['api', function(api){
	var _servObj = {};
	var	_getGenericData = function(func_name){
	}
	
	
	_servObj = {
			getGenericData:_getGenericData
	}
	return _servObj;
}])


.directive('directiveOne', [function(){
     return{
         restrict: 'E',
         controller: 'genericCtrl',
         templateUrl: 'views/generic.html',
         scope:{},
         compile:function(elem, attrs){
        	 attrs.function_name = "directiveOneFn";
        	 attrs.file_name = "Directive_One";
         }
     }
}])

.directive('directiveTwo', [function(){
     return{
         restrict: 'E',
         controller: 'genericCtrl',
         templateUrl: 'views/generic.html',
         scope:{},
         compile:function(elem, attrs){
        	 attrs.function_name = "directiveTwoFn";
        	 attrs.file_name = "Directive_Two";
         }
     }
}])

