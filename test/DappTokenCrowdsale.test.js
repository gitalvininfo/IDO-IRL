const { assert } = require('console');

const BigNumber = web3.BigNumber;
require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();

// import ether from './helpers/ether'

const DappToken = artifacts.require('DappToken');
const DappTokenCrowdsale = artifacts.require('DappTokenCrowdsale');

contract('DappTokenCrowdsale', ([_, wallet, investor1, investor2]) => {
    beforeEach(async () => {
        // token config
        this.name = "Dapp Token";
        this.symbol = "DAPP";
        this.decimals = 18;

        // deploy token
        this.token = await DappToken.new(
            this.name,
            this.symbol,
            this.decimals);

        // crowdsale config
        // 500 because 1 ether = 500 dapp tokens
        this.rate = 500;
        this.wallet = wallet;

        this.crowdsale = await DappTokenCrowdsale.new(
            this.rate,
            this.wallet,
            this.token.address);

        // transfer token ownership to crowdsale
        await this.token.transferOwnership(this.crowdsale.address);
    });

    describe('crowdsale', () => {
        it('tracks the token', async () => {
            const token = await this.crowdsale.token();
            token.should.equal(this.token.address)
        })
        it('tracks the rate', async () => {
            const rate = await this.crowdsale.rate();
            (rate.toNumber()).should.equal(this.rate)
        })
        it('tracks the wallet', async () => {
            const wallet = await this.crowdsale.wallet();
            wallet.should.equal(this.wallet)
        })
    })

    describe('minted crowdsale', () => {
        it('mints tokens after purchase', async () => {
            const value = web3.utils.toWei('3', 'ether');
            const originalTotalSupply = await this.token.totalSupply();
            console.log('originalTotalSupply', originalTotalSupply.toString())
            await this.crowdsale.sendTransaction({ value: value, from: investor1 });
            const newTotalSupply = await this.token.totalSupply();
            console.log('newTotalSupply', newTotalSupply.toString())
        })
    })

    describe('accepting payments', () => {
        it('should accept payments', async () => {
            const value = web3.utils.toWei('1', 'ether');
            const purchaser = investor2;
            await this.crowdsale.sendTransaction({ value: value, from: investor1 }).should.be.fulfilled;
            await this.crowdsale.buyTokens(investor1, { value: value, from: purchaser }).should.be.fulfilled;
        })
    })


})