var path = require("path");
var fs = require("fs");
var request = require("request");
var Database = require("nedb");
var stockList = new Database({ filename: path.join(__dirname, "systemDB/stock_list.db"), autoload: true });
var stockDB = new Database({ filename: path.join(__dirname, "userDB/stock.db"), autoload: true });
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
        $scope.showContent(docs[0]);
      }
    });
  }

  $scope.addStock = function (stockName) {
    if (stockName != null) {
      stockList.find({ name: new RegExp(stockName) }, function (err, doc) {
        var stock = { code: doc[0].code, name: doc[0].name };
        stockDB.insert(stock);
        console.log(stock.name);
        new Database({ filename: path.join(__dirname, "userDB/" + stock.name + ".db") });
        $scope.newStockName = null;
        $scope.showStockList(false);
        $scope.showContent(stock);
      });
    }
  }

  $scope.showContent = function (stock) {
    currentStock = stock;
    $scope.selectedStock = stock.name;
    currentDB = new Database({ filename: path.join(__dirname, "userDB/" + stock.name + ".db"), autoload: true });

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

    $scope.currentPrice = "---";
    $scope.change = "---";

    request.get("http://finance.yahoo.com/d/quotes.csv?s=" + stock.code + ".tw&f=snabp2", function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var data = body.split(",");
        $scope.currentPrice = data[2];
        $scope.change = data[4].replace(/\"/g, '');
        $scope.$apply();
      }
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
    fs.unlink(path.join(__dirname, "userDB/" + stockName + ".db"), function (err) {
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