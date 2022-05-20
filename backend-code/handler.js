'use strict';
var axios = require('axios');
var cheerio = require('cheerio');
var mysql = require("mysql");

function initializeConnection(config) {
  function addDisconnectHandler(connection) {
    connection.on("error", function (error) {
      if (error instanceof Error) {
        if (error.code === "PROTOCOL_CONNECTION_LOST") {
          console.error(error.stack);
          console.log("Lost connection. Reconnecting...");

          initializeConnection(connection.config);
        } else if (error.fatal) {
          throw error;
        }
      }
    });
  }

  var connection = mysql.createConnection(config);

  // Add handlers.
  addDisconnectHandler(connection);

  connection.connect();
  return connection;
}

var connection = mysql.createConnection({
  host: "",
  user: "",
  password: "",
  database: "",
});

const getKeywordUrl = () => {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM keyword_url', (error, rows) => {
      if (error) {
        return reject(error);
      }
      return resolve(rows);
    });
  });
};

const getUrl = () => {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM url', (error, rows) => {
      if (error) {
        return reject(error);
      }
      return resolve(rows);
    });
  });
};

const truncateProductTable = () => {
  return new Promise((resolve, reject) => {
    connection.query('truncate table best_product', (error, rows) => {
      if (error) {
        return reject(error);
      }
      return resolve(rows);
    });
  });
};

const productSave = (insertQuery) => {
  return new Promise((resolve, reject) => {
    connection.query(insertQuery, (error, rows) => {
      if (error) {
        return reject(error);
      }
      return resolve(rows);
    });
  });
};

const productFetchFromUrl = async (pageurl) => {

  const response = await axios(pageurl);
  const html = response.data;
  const $ = cheerio.load(html);

  const statsTable = $('#zg-ordered-list li');
  const products = [];
  var bestSeller = $('h1').text();

  statsTable.each(function () {
    var img = $(this).find('img').attr('src');
    var title = $(this).find('a').first().text().trim();
    var productUrl = $(this).find('a').first().attr('href');

    if (title && img) {
      products.push({
        img,
        title: title.replace(/['"]+/g, ''),
        productUrl: 'https://www.amazon.com' + productUrl,
        bestSeller,
        pageUrl: pageurl,
        keyword: bestSeller.replace(/\s+/g, '-').toLowerCase(),
      });
    }
  });

  for (let product of products) {
    const insertProduct = `insert into best_product(title, product_url, img_url, best_seller_url, best_seller_name, created_date, keyword) values('${product.title}','${product.productUrl}','${product.img}','${product.pageUrl}','${product.bestSeller}', CURRENT_TIMESTAMP(), '${product.keyword}')`;
    await productSave(insertProduct);
  };

  let nextPageUrl = $('.a-last a').attr('href');
  if (nextPageUrl !== undefined) {
    await productFetchFromUrl(nextPageUrl);
  }
}

const getProduct = async () => {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM best_product', (error, rows) => {
      if (error) {
        return reject(error);
      }
      connection.end();
      return resolve(rows);
    });
  });
}


const productFetchFromKeywordUrl = async (pageurl, keyword) => {
  const response = await axios(pageurl);
  const html = response.data;
  const $ = cheerio.load(html);

  const statsTable = $('div.a-spacing-medium');
  const products = [];


  statsTable.each(function () {
    var img = $(this).find('img').attr('src');
    var title = $(this).find('h2').text();
    var productUrl = $(this).find('a').first().attr('href');

    if (img && title) {
      products.push({
        img,
        title: title.replace(/['"]+/g, ''),
        productUrl: 'https://www.amazon.com' + productUrl,
        bestSeller: keyword,
        pageUrl: pageurl,
        keyword: keyword.replace(/\s+/g, '-').toLowerCase(),
      });
    }
  });

  for (let product of products) {
    const insertProduct = `insert into best_product(title, product_url, img_url, best_seller_url, best_seller_name, created_date, keyword) values('${product.title}','${product.productUrl}','${product.img}', '${product.pageUrl}', '${product.bestSeller}', CURRENT_TIMESTAMP(), '${product.keyword}')`;
    await productSave(insertProduct);
  };
}

module.exports.getAmazonAPI = async (event, context, callback) => {
  try {
    connection.connect();
    const rows = await getProduct();

    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        product: rows
      }),
    };


    callback(null, response);

  } catch (err) {
    console.log('catch-err', err);
  }
}


module.exports.getAmazon = async () => {
  try {
    connection.connect();
    const rows = await getUrl();
    console.log('truncate table product');
    await truncateProductTable();

    for (let row of rows) {
      await productFetchFromUrl(row.url);
    };
    connection.end();
  } catch (err) {
    console.log('catch-err', err);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Getting data from amazon function executed successfully!',
      },
      null,
      2
    ),
  };
};


module.exports.amazonKeywordCrawling = async () => {
  try {
    connection.connect();
    const rows = await getKeywordUrl();
    // console.log('truncate table product');
    // await truncateProductTable();

    for (let row of rows) {
      await productFetchFromKeywordUrl(row.url, row.keyword);
    };
    connection.end();
  } catch (err) {
    console.log('catch-err', err);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Getting data from amazon function executed successfully!',
      },
      null,
      2
    ),
  };
};
