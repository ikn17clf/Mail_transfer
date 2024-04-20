// uecrail@gmail.com にメールが来たら xxxxx@gmail.com(サークルの管理者用メールアドレス) にメールを転送する設定をしています
// xxxxx@gmail.com に新着メールが届いたらDiscordの #mail に自動で通知が行くようにしています
// 2022年6月以前はSlackを使用していましたが，2022年7月以降にDiscordに移行しました．

/*
function postSlackbot( message ) {
  let token = "xxxxxxxxxx";
  let slackApp = SlackApp.create( token );

  const channelId = "#mail";
  slackApp.postMessage( channelId, message );
}*/

// # メール にお知らせ
function postDiscordbot(text) {
  // Discord側で作成したボットのウェブフックURL
  const discordWebHookURL = "https://discord.com/api/webhooks/xxxxxxxxxx";

  // 投稿するチャット内容と設定
  const message = {
    "content": text, // チャット本文
    "tts": false  // ロボットによる読み上げ機能を無効化
  }

  const param = {
    "method": "POST",
    "headers": { 'Content-type': "application/json" },
    "payload": JSON.stringify(message)
  }

  UrlFetchApp.fetch(discordWebHookURL, param);
}

function formatDate( date ) {
  const formated = Utilities.formatDate( date, "Asia/Tokyo", "yyyy-MM-dd HH:mm:ss" );
  return formated;
}

function checkMailBox() { // Step 1
  const start = 0;
  const max = 10;
  const query = "after:2022/02/07"; // Step 2

  const FOLDER_ID = 'xxxxxxxxxx'; //メールの添付ファイルをアップロードするためのGoogle DriveのフォルダID
  const threads = GmailApp.search(query, start, max);
  const messagesForThreads = GmailApp.getMessagesForThreads( threads );

  for( const messages of messagesForThreads ){
    for( const message of messages ){

      const subject = message.getSubject();
      const body = message.getPlainBody();

      // メールの添付ファイルがある場合
      // Google Driveのフォルダに添付ファイルをアップロードした上で
      // 添付ファイルを閲覧できるURLを発行し，Discordに送信するメッセージに加える
      const attachments = message.getAttachments();
      const numAttatchments = message.getAttachments().length;
      var attatchment_url = "";
      const folder = DriveApp.getFolderById(FOLDER_ID);
      if( message.isUnread() ) {
        for(const attachment of attachments){
          var driveFile = folder.createFile(attachment);
          attatchment_url += String(driveFile.getUrl()) + "\n";
        }
      }

      const numAttatchmentsAsStr = Utilities.formatString( "%d *オリジナルのメールを確認してください*\n 添付ファイルURL:\n%s", numAttatchments,attatchment_url );
      const attatchmentStr = numAttatchments > 0 ? numAttatchmentsAsStr : "0";
      const date = formatDate( message.getDate() );

      if( !message.isUnread() ) { // Step 3
        console.log( Utilities.formatString( "%s is already read", subject ) );
        continue;
      }

      if(subject.match("Summary of failures for Google Apps Script")){
        console.log( Utilities.formatString( "%s is the error of Google Apps Script", subject ) );
        continue;
      }

      if(subject.match("共有されたドキュメント: 「電気通信大学鉄道研究会議事録_")){
        console.log( Utilities.formatString( "%s is the minutes of the meeting of uecrail", subject ) );
        continue;
      }

      const txts = [ // Step 4
        Utilities.formatString( "件名: *%s*", subject ),
        Utilities.formatString( "送信日: %s 添付ファイルの数: %s", date, attatchmentStr ),
        "```",
        body,
        "```"
      ];

      const txt = txts.join( "\n" );
      console.log( txt.substr(0, 200) );
      message.markRead(); // Step 5

      postDiscordbot( txt ); // Step 6
    }
  }
}
