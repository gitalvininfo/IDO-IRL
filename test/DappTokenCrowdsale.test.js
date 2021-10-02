
const BigNumber = web3.utils.BN;
require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should(),
    assert

// import ether from './helpers/ether'

// const assert = require('chai').assert

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
        this.cap = new BigNumber(web3.utils.toWei('100', 'ether'))
        // investor caps
        this.investorMinCap = new BigNumber(web3.utils.toWei('0.002', 'ether'))
        this.investorMaxCap = new BigNumber(web3.utils.toWei('50', 'ether'))

        this.crowdsale = await DappTokenCrowdsale.new(
            this.rate,
            this.wallet,
            this.token.address,
            this.cap);

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
            const value = new BigNumber(web3.utils.toWei('1', 'ether'))
            const originalTotalSupply = await this.token.totalSupply();
            await this.crowdsale.sendTransaction({ value: value, from: investor1 });
            const newTotalSupply = await this.token.totalSupply();
            assert.isTrue(newTotalSupply > originalTotalSupply)
        })
    })

    describe('capped crowdsale', async () => {
        it('has the correct hard cap', async () => {
            const cap = await this.crowdsale.cap();
            (cap.toString()).should.equal(this.cap.toString())
        })
    })

    describe('accepting payments', () => {
        it('should accept payments', async () => {
            const value = new BigNumber(web3.utils.toWei('1', 'ether'))
            const purchaser = investor2;
            await this.crowdsale.sendTransaction({ value: value, from: investor1 }).should.be.fulfilled;
            await this.crowdsale.buyTokens(investor1, { value: value, from: purchaser }).should.be.fulfilled;
        })
    })


    describe('buyTokens()', () => {
        describe('when the contribution is less than the minimum cap', () => {
            it('rejects the transaction', async () => {
                const value = this.investorMinCap - 1;
                await this.crowdsale.buyTokens(investor2, { value: value, from: investor2 }).should.be.rejectedWith('revert')
            })
        })
    })

    describe('investor has already met the minimum cap', () => {
        it('allow the investor to contribute below the minimum cap', async () => {
            // first contribution is valid
            const value1 = new BigNumber(web3.utils.toWei('1', 'ether'));
            await this.crowdsale.buyTokens(investor1, { value: value1, from: investor1 });

            // second contribution is less than investor cap
            const value2 = 1;
            await this.crowdsale.buyTokens(investor1, { value: value2, from: investor1 }).should.be.fulfilled;

        })
    })

    describe('when the total contributions exceed the investor cap', () => {
        it('rejects the transaction', async () => {
            // first contribution is in valid range;
            const value1 = new BigNumber(web3.utils.toWei('2', 'ether'))
            await this.crowdsale.buyTokens(investor1, { value: value1, from: investor1 }).should.be.fulfilled;

            // second contribution exceed the range
            const value2 = new BigNumber(web3.utils.toWei('49', 'ether'));
            await this.crowdsale.buyTokens(investor1, { value: value2, from: investor1 }).should.be.rejectedWith('revert')
        })
    })


    describe('when the contribution is within the valid range', () => {
        const value = new BigNumber(web3.utils.toWei('2', 'ether'));
        it('succeeds and updates the contribution amount', async () => {
            await this.crowdsale.buyTokens(investor2, { value: value, from: investor2 }).should.be.fulfilled
            const contribution = await this.crowdsale.getUserContribution(investor2);
            (contribution.toString()).should.equal(value.toString())
        })
    })




})