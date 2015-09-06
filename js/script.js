var path = require("path");
var fs = require("fs");
var Database = require("nedb");
var stockDB = new Database({ filename: path.join(__dirname, "db/stock.db"), autoload: true });
var currentDB;
var currentStock;
var addActions = [ "買進股票", "股票股利" ];
var minusActions = [ "賣出股票", "現金股利", "減資配發" ];

var stockBook = angular.module('stockbook', []);

stockBook.controller("StockListCtrl", function ($scope) {
  $scope.actions = addActions.concat(minusActions);
  $scope.stocks = [];
  $scope.records = [];

  $scope.showStockList = function (isInitial) {
    stockDB.find({}, function (err, docs) {
      $scope.stocks = docs;
      $scope.isEmpty = docs.length == 0;
      $scope.$apply();
      if (docs.length != 0 && isInitial) {
        $scope.showContent(docs[0].name);
      }
    });
  }

  $scope.addStock = function (stockName) {
    if (stockName != null) {
      var stock = { name: stockName };
      stockDB.insert(stock);
      new Database({ filename: path.join(__dirname, "db/" + stockName + ".db") });
      $scope.newStockName = null;
      $scope.showStockList(false);
      $scope.showContent(stockName);
    }
  }

  $scope.showContent = function (stockName) {
    currentStock = stockName;
    $scope.selectedStock = stockName;
    currentDB = new Database({ filename: path.join(__dirname, "db/" + stockName + ".db"), autoload: true });

    currentDB.find({}).sort({ date: -1 }).exec(function (err, docs) {
      var totalShare = 0;
      var totalInvest = 0;

      for (var i = 0; i < docs.length; i++) {
        if (addActions.indexOf(docs[i].action) != -1) {
          totalShare += docs[i].share;
          totalInvest += docs[i].amount;
        }
        else if (minusActions.indexOf(docs[i].action) != -1) {
          totalShare -= docs[i].share;
          totalInvest -= docs[i].amount;
        }
      }

      $scope.records = docs;
      $scope.totalShare = totalShare;
      $scope.totalAmount = totalInvest;
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
    $scope.showContent(currentStock);
    $scope.date = $scope.action = $scope.share = $scope.price = $scope.amount = null;
  }

  $scope.deleteRecord = function (id) {
    currentDB.remove({ _id: id }, {});
    $scope.showContent(currentStock);
  };

  $scope.deleteStock = function (stockName) {
    fs.unlink(path.join(__dirname, "db/" + stockName + ".db"), function (err) {
      if (err) throw err;
    });
    stockDB.remove({ name: stockName }, {});
    $scope.showStockList(true);
  };

  $scope.showStockList(true);
});

$("#datepicker").datetimepicker({
  timepicker: false,
  format: "Y-m-d",
  scrollInput: false
});