require('module-alias/register');
const BOBasePage = require('@pages/BO/BObasePage');

module.exports = class Preferences extends BOBasePage {
  constructor(page) {
    super(page);

    this.pageTitle = 'Preferences •';

    // Selectors for currency restrictions
    this.euroCurrencyRestrictionsCheckbox = paymentModule => '#form_payment_module_preferences_currency_restrictions_'
      + `${paymentModule}_0`;
    this.currencyRestrictionsSaveButton = '#main-div div:nth-child(1) > div.card-footer button';
    // Selectors for group restrictions
    this.paymentModuleCheckbox = (paymentModule, groupID) => '#form_payment_module_preferences_group_restrictions_'
      + `${paymentModule}_${groupID}`;
    this.countryRestrictionsCheckbox = (paymentModule, countryID) => '#form_payment_module_preferences_country_'
      + `restrictions_${paymentModule}_${countryID}`;
    this.groupRestrictionsSaveButton = '#main-div div:nth-child(2) > div.card-footer button';
  }

  /*
  Methods
   */
  /**
   * Set currency restrictions
   * @param paymentModule
   * @param valueWanted
   * @returns {Promise<string>}
   */
  async setCurrencyRestriction(paymentModule, valueWanted) {
    await this.page.waitForSelector(
      this.euroCurrencyRestrictionsCheckbox(paymentModule),
      {state: 'attached'},
    );
    const isCheckboxSelected = await this.isCheckboxSelected(
      this.euroCurrencyRestrictionsCheckbox(paymentModule),
    );
    if (valueWanted !== isCheckboxSelected) {
      await this.page.$eval(`${this.euroCurrencyRestrictionsCheckbox(paymentModule)} + i`, el => el.click());
    }
    await this.page.click(this.currencyRestrictionsSaveButton);
    return this.getTextContent(this.alertSuccessBlock);
  }

  /**
   * Set group restrictions
   * @param group
   * @param paymentModule
   * @param valueWanted
   * @returns {Promise<string>}
   */
  async setGroupRestrictions(group, paymentModule, valueWanted) {
    const selector = this.paymentModuleCheckbox(paymentModule, group);
    await this.page.waitForSelector(`${selector} + i`, {state: 'attached'});
    const isCheckboxSelected = await this.isCheckboxSelected(selector);
    if (valueWanted !== isCheckboxSelected) {
      await this.page.$eval(`${selector} + i`, el => el.click());
    }
    await this.page.click(this.groupRestrictionsSaveButton);
    return this.getTextContent(this.alertSuccessBlock);
  }

  /**
   * Set country restrictions
   * @param countryID
   * @param paymentModule
   * @param valueWanted
   * @returns {Promise<string>}
   */
  async setCountryRestriction(countryID, paymentModule, valueWanted) {
    await this.page.waitForSelector(
      `${this.countryRestrictionsCheckbox(paymentModule, countryID)} + i`,
      {state: 'attached'},
    );
    const isCheckboxSelected = await this.isCheckboxSelected(
      this.countryRestrictionsCheckbox(paymentModule, countryID),
    );
    if (valueWanted !== isCheckboxSelected) {
      await this.page.$eval(`${this.countryRestrictionsCheckbox(paymentModule, countryID)} + i`, el => el.click());
    }
    await this.page.click(this.currencyRestrictionsSaveButton);
    return this.getTextContent(this.alertSuccessBlock);
  }
};
