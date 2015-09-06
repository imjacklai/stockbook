var path = require("path");
var Database = require("nedb");
var stockDB = new Database({ filename: path.join(__dirname, "db/stock.db"), autoload: true });

var stockBook = angular.module('stockbook', ['ui.bootstrap']);

stockBook.controller("TabsCtrl", function($scope, $window) {
});

stockBook.controller("StockListCtrl", function($scope) {
  $scope.stocks = [];

  stockDB.find({}, function(err, docs) {
    $scope.stocks = docs;
    $scope.$apply();
  });

  $scope.addStock = function(stockName) {
    if (stockName != "") {
      $scope.stocks.push({ name: stockName });
      var stock = { name: stockName };

      stockDB.insert(stock);

      new Database({ filename: path.join(__dirname, "db/" + stockName + ".db"), autoload: true });

      $scope.newStockName = null;
    }
  }

  $scope.showContent = function(stockName) {
    $scope.title = stockName;
    $scope.selectedStock = stockName;
  }
});