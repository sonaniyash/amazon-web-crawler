var express = require('express');
var axios = require('axios');
var cheerio = require('cheerio');
var mysql = require("mysql");
require('dotenv').config();

var app = express();
app.use(express.json());

var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "amazon",
});
connection.connect();

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

const productFetchFromUrl = async (url) => {
    const response = await axios(url);
    const html = response.data;
    const $ = cheerio.load(html);

    const statsTable = $('#zg-ordered-list li');
    const products = [];
    var bestSeller = $('h1').text();

    statsTable.each(function () {
        var img = $(this).find('img').attr('src');
        var title = $(this).find('a').first().text().trim();
        var productUrl = $(this).find('a').first().attr('href');
        if (img && title) {
            products.push({
                img,
                title: title.replace(/['"]+/g, ''),
                productUrl: 'https://www.amazon.com' + productUrl,
                bestSeller,
                pageUrl: url,
                keyword: bestSeller.replace(/\s+/g, '-').toLowerCase(),
            });
        }
    });

    for (let product of products) {
        const insertProduct = `insert into best_product(title, product_url, img_url, best_seller_url, best_seller_name, created_date, keyword) 
        values("${product.title}", "${product.productUrl}", "${product.img}", "${product.pageUrl}", "${product.bestSeller}", CURRENT_TIMESTAMP(), "${product.keyword}")`
        await productSave(insertProduct);
    };

    let nextPageUrl = $('.a-last a').attr('href');
    if (nextPageUrl !== undefined) {
        await productFetchFromUrl(nextPageUrl);
    }
}

const scrapingAmazonProduct = async (req, res) => {
    try {
        const rows = await getUrl();
        console.log('truncate table product');
        await truncateProductTable();

        for (let row of rows) {
            await productFetchFromUrl(row.url);
        };
        res.send({
            message: 'Getting data from amazon function executed successfully!'
        });
    } catch (err) {
        console.log('catch-err-crawling-api', err);
    }
}

const productFetchFromKeywordUrl = async (url, keyword) => {
    const urlLink = `${url}`;
    const response = await axios(urlLink);
    const html = response.data;
    const $ = cheerio.load(html);

    const statsTable = $('div.a-spacing-medium');
    const products = [];

    statsTable.each(function () {
        var img = $(this).find('img').attr('src');
        var title = $(this).find('h2').text();
        var productUrl = $(this).find('a').first().attr('href');

        if (title && img) {
            products.push({
                img,
                title: title.replace(/['"]+/g, ''),
                productUrl: 'https://www.amazon.com' + productUrl,
                bestSeller: keyword,
                pageUrl: url,
                keyword: keyword.replace(/\s+/g, '-').toLowerCase().replace('"', ''),
            });
        }
    });

    for (let product of products) {
        const insertProduct = `insert into best_product(title, product_url, img_url, best_seller_url, best_seller_name, created_date, keyword) 
            values("${product.title}", "${product.productUrl}", "${product.img}", "${product.pageUrl}", "${product.bestSeller}", CURRENT_TIMESTAMP(), "${product.keyword}")`

        await productSave(insertProduct);
    };
}

const scrapingAmazonKeywordProduct = async (req, res) => {
    try {
        const rows = await getKeywordUrl();
        // console.log('truncate table product');
        // await truncateProductTable();

        for (let row of rows) {
            await productFetchFromKeywordUrl(row.url, row.keyword);
        };
        res.send({
            message: 'Getting data from amazon function executed successfully!'
        });
    } catch (err) {
        console.log('catch-err-crawling-api', err);
    }
}

const getProduct = async () => {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM best_product', (error, rows) => {
            if (error) {
                return reject(error);
            }
            return resolve(rows);
        });
    });
}

const getAmazonAPI = async (req, res) => {
    try {
        const rows = await getProduct();
        res.send({
            data: rows,
            message: 'Data getting successfully'
        });
    } catch (err) {
        console.log('catch-err-get-product', err);
    }
}

const getProductByKeyword = async (keyword) => {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM best_product where keyword='${keyword}'`, (error, rows) => {
            if (error) {
                return reject(error);
            }
            return resolve(rows);
        });
    });
}

const getAmazonProductByKeyword = async (req, res) => {
    try {
        const { body } = req;
        const rows = await getProductByKeyword(body.keyword);
        res.send({
            data: rows,
            message: 'Data getting successfully'
        });
    } catch (err) {
        console.log('catch-err-get-product', err);
    }
}

var router = express.Router();
router.get('/api/crawling', scrapingAmazonProduct);
router.get('/api/keyword-crawling', scrapingAmazonKeywordProduct);
router.get('/api/get-product', getAmazonAPI);
router.post('/api/get-product-by-keyword', getAmazonProductByKeyword);

app.use(router);
app.listen(process.env.NODE_SERVER || 3001, () => {
    console.log('Magic happens on port 3001');
});