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
var d = new RollingSpider({uuid:"83641ca90d2940579002d34ff44c3028"});

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
