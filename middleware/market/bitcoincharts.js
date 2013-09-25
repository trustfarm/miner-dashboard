'use strict';

var request = require('request'),
    config = require('../../config/config.json'),
    marketStats = {};

function updateMarketStats() {
    request({
        uri:  'http://api.bitcoincharts.com/v1/markets.json',
        json: true
    }, function (err, res) {
        var market = res.body.filter(function (market) {
            return market.symbol === config.bitcoincharts.symbol;
        })[0];

        marketStats = market;
    });
}

updateMarketStats();
setInterval(updateMarketStats, 60 * 60 * 1e3);

module.exports = function (data, callback) {
    data.market = marketStats;
    callback(null);
};