const Discord = require('discord.js');
const schedule = require('node-schedule');
const client = new Discord.Client();
const pg = require('pg');
const DATABASE_URL = process.env.DATABASE_URL;


client.login('MjkxNDUwODgwMjc0NzI2OTIz.C7hkMA.hOBTTaqEBkQmlZfW_egKwXwBhH4');

client.on('ready', () => {});

client.on('message', (message) => {
  if (message.author.bot) return;

  let channel = message.channel;
  let args = message.content.match(/[\w|\/|\:|\.|\_|\-]+|"[^"]+"/g);
  let command = args.shift();

  switch (command) {
    case '/addshow':
      addShow(args);
      break;
    case '/dropshow':
      dropShow(args);
      break;
    case '/listshows':
      listShows(args);
      break;
    case '/prep':
      prep();
      break;
    case '/swap':
      swapShows();
      break;
    default:
      break;
  }
});


function prep() {
  pg.connect(DATABASE_URL, (err, pgclient, done) => {
    pgclient.query(
      'SELECT * FROM anime order by id',
      (err, result) => {
        if (err) console.error(err);
        else sendPrepMessage(result.rows);
        done();
      })
      .then(() => pgclient.query('update anime set curr_ep = curr_ep + 1'))
      .then(() => pgclient.query('delete from products where curr_ep >= last_ep'));
  });
}

function sendPrepMessage(rows) {
  let channel = client.channels.find('name', 'general');
  if (rows.length === 0) {
    return channel.sendMessage('ANIME IS DEAD');
  }
  output = rows.map( row => 
    `${row.name}: (${row.url_pre}${row.curr_ep}${row.url_post})`
  ).join('\n');

  channel.sendMessage(output);
}

function addShow(args) {
  let channel = client.channels.find('name', 'general');

  if (args.length < 2 || args.length > 3) {
    console.log(args)
    return channel.sendMessage('USAGE: /addshow name url [last episode]');
  }

  let name = args[0].replace(/^"(.+)"$/g, '$1').replace(/^'(.+)'$/g, '$1');
  let last_ep = args[2];

  let match = args[1].match(/(.+)(\d+)([^\d]*)/);

  let url_pre = match[1];
  let curr_ep = parseInt(match[2]);
  let url_post = match[3];

  pg.connect(DATABASE_URL, (err, pgclient, done) => {
    pgclient.query(`
        insert into anime (name, last_ep, curr_ep, url_pre, url_post)
        values ($1, $2, $3, $4, $5)
      `,
      [name, last_ep, curr_ep, url_pre, url_post],
      (err, result) => {
        done();
        if (err) channel.sendMessage(`Something went wrong`);
        else channel.sendMessage(`${name} was added`);
      }
    );
  });
}

function swapOrder(args) {
  let channel = client.channels.find('general');
  if (args.length !== 2) {
    return channel.sendMessage('USAGE: /swapOrder show_id_1 show_id_2');
  }

  pg.connect(DATABASE_URL, (err, pgclient, done) => {
    pgclient.query(`
        update anime set id = anime_old.id from anime anime_old where (anime.id, anime_old.id) in (($1, $2), ($2, $1))
      `,
      [args[0], args[1]],
      (err, result) => {
        done();
        if (err) {
          channel.sendMessage(`Something went wrong`);
        }
        else channel.sendMessage(`View order swapped for anime ${args[0]} and ${args[0]}`);
      }
    );
  });
}

function dropShow(args) {
  let channel = client.channels.find('name', 'general');

  if (args.length !== 1)
    return channel.sendMessage('USAGE: /addshow name url [last episode]');

  let id = parseInt(args[0]);

  pg.connect(DATABASE_URL, (err, pgclient, done) => {
    pgclient.query(
      `delete from anime where id = $1`,
      [id],
      (err, result) => {
        done();
        if (err) {
          channel.sendMessage('Something went wrong.');
          console.log(err);
        }
        else channel.sendMessage(`Anime with id of ${id} was deleted`);
      }
    );
  });
}

function listShows(args) {
  pg.connect(DATABASE_URL, (err, pgclient, done) => {
    pgclient.query('SELECT * FROM anime', (err, result) => {
      done();
      if (err) {
        console.error(err);
      }
      else {
        let channel = client.channels.find('name', 'general');
        if (result.rows.length === 0) {
          return channel.sendMessage('No shows stored');
        }
        output = result.rows.map(
          row => `${row.id}) ${row.name}: (${row.url_pre}${row.curr_ep}${row.url_post}) order by id`
        ).join('\n');
        channel.sendMessage(`HAHA! TIME FOR PREPWORK!\n${output}`);
      }
    });
  });
}

function editShow(args) {
  if (args.count % 2 !== 1) {
    channel.sendMessage('USAGE: /editshow id [[currentEpisode | lastEpisode | url] [value]]');
  }
  pg.connect(
    DATABASE_UTL,
    (err, pgclient, done) => 
      pgclient.query(
        `update id`,
        [],
        update)
        .then(done);
    }
  );
}

function initDb () {
  pg.connect(DATABASE_URL, (err, pgclient, done) => {
    let createSeq = () => pgclient.query(
      'create sequence if not exists anime_id_seq'
    );
    let createTable = () => pgclient.query(
      `create table if not exists anime(
        id int not null default nextval('anime_id_seq'),
        name text,
        curr_ep int,
        last_ep int,
        url_pre text,
        url_post text
      )`
    );
    let alterSeq = () => pgclient.query(
      'alter sequence anime_id_seq owned by anime.id'
    );
    createSeq()
      .then(createTable, done)
      .then(alterSeq, done)
      .then(done);
  });

}

initDb();
