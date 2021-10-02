const BigNumber = web3.BigNumber;
require('chai')
    .use(require('chai-bignumber')(BigNumber))
    .should();

const DappToken = artifacts.require('DappToken');
const DappTokenCrowdsale = artifacts.require('DappTokenCrowdsale');

contract('DappTokenCrowdsale', ([_, wallet]) => {
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
})