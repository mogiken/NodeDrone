//サーバー
var http = require('http');
url = require('url');
//urlパーサー
var bodyParser = require('body-parser');
//UI
var express = require('express');
//express設定
var app = express();
//HTMLソース
app.use(express.static('front'));
app.use(bodyParser.json());
//サーバー起動
app.listen(3000);


//ドローンのライブラリ。詳細はここ。https://github.com/voodootikigod/node-rolling-spider
var RollingSpider = require("rolling-spider");
//時間を置いて実行するライブラリ
var temporal = require('temporal');
//キーボードライブラリ
var keypress = require('keypress');
//標準入力からキーを取得する
keypress(process.stdin);
//キーを取得するための設定
process.stdin.setRawMode(true);
process.stdin.resume();

//finddrone.jsで見つかったDroneのBluetoothのUUIDを書き換えてください。ほかはb36b4163ba3845089618e6cabe865c8a,83641ca90d2940579002d34ff44c3028
var d = new RollingSpider({uuid:"e1834177a8224268bedca00ac8b2157c"});

//動作ステップ
var STEPS = 2;

//ドローンに接続
d.connect(function () {
  d.setup(function () {
    console.log('設定中', d.name);
    d.flatTrim();
    d.startPing();
    d.flatTrim();//水平調整
    console.log(d.name + '設定完了');
  });
});

//keypressイベントの処理
process.stdin.on('keypress', function (ch, key) {
  console.log('got "keypress" => ', key);

  if ( key) {
    var param = {tilt:0, forward:0, turn:0, up:0};

    if (key.name === 'l') {
      //着陸
      console.log('land');
      d.land();
    } else if (key.name === 't') {
      //テイクオフ
      console.log('takeoff');
      d.takeOff();
      d.flatTrim();
    } else if (key.name === 'x') {
      //接続解除。ちゃんと解除しないと接続しっぱなし。
      console.log('land');
      d.land();
      console.log('disconnect');
      d.disconnect();
      process.stdin.pause();
      process.exit();
    }

    if (key.name === 'up') {
      //矢印キー
      d.forward({ steps: STEPS });
    } else if (key.name === 'down') {
      //矢印キー
      d.backward({ steps: STEPS });
    } else if (key.name === 'right') {
      //矢印キー
      d.tiltRight({ steps: STEPS });
    } else if (key.name === 'left') {
      //矢印キー
      d.tiltLeft({ steps: STEPS });
    } else if (key.name === 'u') {
      //上昇
      d.up({ steps: STEPS });
    } else if (key.name === 'd') {
      //下降
      d.down({ steps: STEPS });
    }

    if (key.name === 'w') {
      //右回転
      param.turn = 90;
      d.drive(param, STEPS);
    }
    if (key.name === 'q') {
      //左回転
      param.turn = -90;
      d.drive(param, STEPS);
    }
    //自動操縦
    if (key.name === 'a') {
      //delay(mSec)にあとに順番に実行します
      temporal.queue([
            {
              delay: 1000,
              task: function () {
                d.takeOff();
              }
            },
            {
              delay: 5000,
              task: function () {
                d.land();
              }
            }
      ]);
    }
  }
});
//API郡
app.get("/command/takeoff", function(req, res) {
  //テイクオフ
  console.log('takeoff');
  d.takeOff();
  res.send("OK");
});
app.get("/command/land", function(req, res) {
  //着陸
  console.log('land');
  d.land();
  res.send("OK");
});
app.get("/command/temp/:temp10/:temp1", function(req, res) {
  var temp10 = req.params.temp10;
  var temp1 = req.params.temp1;
  console.log('temp:'+temp10+temp1);
  //行動
  var myaction = [];
  var waitAction = {
        delay: 2000,
        task: function(){
        }
      };
  var rightAction = {
        delay: 1000,
        task: function(){
          //右回転
          param = {tilt:0, forward:0, turn:0, up:0};
          param.turn = 45;
          if(d)d.drive(param, STEPS);
        }
      };
  var leftAction = {
        delay: 1000,
        task: function(){
          //左回転
          param = {tilt:0, forward:0, turn:0, up:0};
          param.turn = -45;
          if(d)d.drive(param, STEPS);
        }
      };

  //10のくらい
  for (var i = 0; i < temp10; i++) {
    myaction.push(rightAction);
    myaction.push(leftAction);
  }
  //間を置く
  myaction.push(waitAction);
  //1のくらい
  for (var i = 0; i < temp1; i++) {
    myaction.push(leftAction);
    myaction.push(rightAction);
  }
  console.log(JSON.stringify(myaction));
  console.log(myaction);
  //実行
  temporal.queue(myaction);

  res.send("OK");
});

//デフォルトエラー.最後に定義しないとダメ。try catchが不要になる。
app.use(function(err, req, res, next) {
  //console.log("err:"+err.message);
  var msg = {};
  msg.error = err.message;
  res.status(500).send(msg);
});
