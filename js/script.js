var path = require("path");
var Database = require("nedb");
var stockDB = new Database({ filename: path.join(__dirname, "db/stock.db"), autoload: true });
var currentDB;
var currentStock;

var stockBook = angular.module('stockbook', []);

stockBook.controller("StockListCtrl", function ($scope) {
  $scope.actions = [ "買進", "賣出", "現金股利", "股票股利", "減資配發" ]
  $scope.stocks = [];
  $scope.records = [];

  stockDB.find({}, function (err, docs) {
    $scope.stocks = docs;
    $scope.$apply();
    $scope.showContent(docs[0].name);
  });

  $scope.addStock = function (stockName) {
    if (stockName != null) {
      $scope.stocks.push({ name: stockName });
      var stock = { name: stockName };

      stockDB.insert(stock);

      new Database({ filename: path.join(__dirname, "db/" + stockName + ".db"), autoload: true });

      $scope.newStockName = null;
    }
  }

  $scope.showContent = function (stockName) {
    currentStock = stockName;
    $scope.selectedStock = stockName;
    currentDB = new Database({ filename: path.join(__dirname, "db/" + stockName + ".db"), autoload: true });
    currentDB.find({}).sort({ date: -1 }).exec(function (err, docs) {
      $scope.records = docs;
      $scope.$apply();
    });
  }

  $scope.addRecord = function () {
    if ($scope.share == null) {
      $scope.share = 0;
    }

    if ($scope.price == null) {
      $scope.price = 0;
    }

    if ($scope.amount == null) {
      $scope.amount = 0;
    }

    var record = {
      date: $scope.date,
      action: $scope.action,
      share: $scope.share,
      price: $scope.price,
      amount: $scope.amount
    };

    currentDB.insert(record);

    $scope.records.push({
      date: $scope.date,
      action: $scope.action,
      share: $scope.share,
      price: $scope.price,
      amount: $scope.amount
    });

    $scope.date = $scope.action = $scope.share = $scope.price = $scope.amount = null;
  }

  $scope.delete = function (id) {
    currentDB.remove({ _id: id }, {});
    $scope.showContent(currentStock);
  };
});

$("#datepicker").datetimepicker({
  timepicker: false,
  format: "Y-m-d",
  scrollInput: false
});