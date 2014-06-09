'use strict';

var EventEmitter = require('events').EventEmitter,
    _ = require('lodash'),
    Solo = require('../../../../../lib/modules/revenue/solo');

describe('modules/revenue/solo', function () {
    var defaultConfig = {
        miner: 'minerId',
        market: 'marketId',
        technical: 'technicalId'
    };

    beforeEach(function () {
        this.app = new EventEmitter();
    });

    it('should calculate revenue when any miner hashrate is updated', function (done) {
        var config = {
                miner: [ 'minerId1', 'minerId2' ],
                market: 'marketId',
                technical: 'technicalId'
            },
            solo = new Solo(this.app, config);

        solo.minerData = {
            minerId1: { averageHashrate: 0.5 * 1e-6 }
        };
        solo.marketData = { close: 100, currency: 'NMC' };
        solo.technicalData = { blockReward: 10, probability: 0.0001 };

        solo.on('change', function () {
            expect(_.omit(solo.toJSON(), 'historicalData')).to.deep.equal({
                value: 8640,
                currency: 'NMC',
                interval: 'Day'
            });
            done();
        });

        this.app.emit('update:data:minerId2', { averageHashrate: 0.5 * 1e-6 });
    });

    it('should calculate revenue when miner is not connected', function (done) {
        var solo = new Solo(this.app, defaultConfig);

        solo.marketData = { close: 100, currency: 'NMC' };
        solo.technicalData = { blockReward: 10, probability: 0.0001 };

        solo.on('change', function () {
            expect(_.omit(solo.toJSON(), 'historicalData')).to.deep.equal({
                value: 0,
                currency: 'NMC',
                interval: 'Day'
            });
            done();
        });

        this.app.emit('update:data:minerId', { connected: false });
    });

    it('should calculate revenue when market prices are updated', function (done) {
        var solo = new Solo(this.app, defaultConfig);

        solo.minerData = { minerId: { averageHashrate: 1e-6 } };
        solo.technicalData = { blockReward: 10, probability: 0.0001 };

        solo.on('change', function () {
            expect(_.omit(solo.toJSON(), 'historicalData')).to.deep.equal({
                value: 8640,
                currency: 'NMC',
                interval: 'Day'
            });
            done();
        });

        this.app.emit('update:data:marketId', { close: 100, currency: 'NMC' });
    });

    it('should calculate revenue when no market is specified', function (done) {
        var solo = new Solo(this.app, {
            miner: 'minerId',
            technical: 'technicalId'
        });

        solo.technicalData = { blockReward: 10, probability: 0.0001, coin: 'NMC' };

        solo.on('change', function () {
            expect(_.omit(solo.toJSON(), 'historicalData')).to.deep.equal({
                value: 86.4,
                currency: 'NMC',
                interval: 'Day'
            });
            done();
        });

        this.app.emit('update:data:minerId', { averageHashrate: 1e-6 });
    });

    it('should calculate revenue when technical info is updated', function (done) {
        var solo = new Solo(this.app, defaultConfig);

        solo.minerData = { minerId: { averageHashrate: 1e-6 } };
        solo.marketData = { close: 100, currency: 'NMC' };

        solo.on('change', function () {
            expect(_.omit(solo.toJSON(), 'historicalData')).to.deep.equal({
                value: 8640,
                currency: 'NMC',
                interval: 'Day'
            });
            done();
        });

        this.app.emit('update:data:technicalId', { blockReward: 10, probability: 0.0001 });
    });

    it('should set the title to "Revenue" when no title is set in config', function () {
        var solo = new Solo(this.app, {});
        expect(solo.title).to.equal('Revenue');
    });

    it('should set the title to config.title when it is set', function () {
        var solo = new Solo(this.app, {
                title: 'Some Title'
            });
        expect(solo.title).to.equal('Some Title');
    });

    it('should add the values to historicalData', function () {
        var solo = new Solo(this.app, {}),
            now = new Date().getTime();

        solo.set({ currency: 'BTC', value: 123, interval: 'Day' });
        expect(solo.get('historicalData')).to.have.length(1);
        expect(solo.get('historicalData')[0].value).to.equal(123);
        expect(solo.get('historicalData')[0].timestamp).to.be.within(now-1, now+1);
    });

});