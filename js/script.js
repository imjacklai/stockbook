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

var stockBook = angular.module('stockbook', ["ngDialog"]);

stockBook.controller("StockListCtrl", function ($scope, ngDialog) {
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

  $scope.checkExistOrAdd = function (stock) {
    stockDB.find({ code: stock.code }, function (err, docs) {
      if (docs.length == 0) {
        stockDB.insert(stock);
        new Database({ filename: path.join(__dirname, "userDB/" + stock.name + ".db") });
        $scope.newStockName = null;
        $scope.showStockList(false);
        $scope.showContent(stock);
      }
      else {
        ngDialog.open({
          template: "<p>你輸入的股票已經存在</p>",
          plain: true
        });
      }
    });
    $scope.newStockName = null;
  }

  $scope.addStock = function (stockName) {
    if (stockName != null) {
      stockList.find({ name: new RegExp(stockName) }, function (err, docs) {
        if (docs.length > 1) {
          var content = "<p>請選擇要加入的股票</p>";
          for (var i = 0; i < docs.length; i++) {
            content += "<button class='btn btn-primary select-btn' ng-click='closeThisDialog(" + i + ")'>" + docs[i].name + "</Button>";
          }

          ngDialog.open({
            template: content,
            plain: true,
            preCloseCallback: function(value) {
              if (docs[value] != null) {
                var stock = { code: docs[value].code, name: docs[value].name };
                $scope.checkExistOrAdd(stock);
              }
            }
          });
        }
        else if (docs.length == 1) {
          var stock = { code: docs[0].code, name: docs[0].name };
          $scope.checkExistOrAdd(stock);
        }
        else {
          ngDialog.open({
            template: "<p>找不到輸入的股票名稱</p>",
            plain: true
          });
          $scope.newStockName = null;
        }
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

    $("#all").show();
    $(".spinner").hide();
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
  scrollInput: false,
  lang: "zh-TW"
});