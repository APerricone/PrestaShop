/**
 * Copyright since 2007 PrestaShop SA and Contributors
 * PrestaShop is an International Registered Trademark & Property of PrestaShop SA
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Open Software License (OSL 3.0)
 * that is bundled with this package in the file LICENSE.md.
 * It is also available through the world-wide-web at this URL:
 * https://opensource.org/licenses/OSL-3.0
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@prestashop.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade PrestaShop to newer
 * versions in the future. If you wish to customize PrestaShop for your
 * needs please refer to https://devdocs.prestashop.com/ for more information.
 *
 * @author    PrestaShop SA and Contributors <contact@prestashop.com>
 * @copyright Since 2007 PrestaShop SA and Contributors
 * @license   https://opensource.org/licenses/OSL-3.0 Open Software License (OSL 3.0)
 */
require('module-alias/register');

const {expect} = require('chai');

// Import utils
const helper = require('@utils/helpers');
const loginCommon = require('@commonTests/loginBO');

// Import pages
const LoginPage = require('@pages/BO/login');
const DashboardPage = require('@pages/BO/dashboard');
const ProductSettingsPage = require('@pages/BO/shopParameters/productSettings');
const ProductsPage = require('@pages/BO/catalog/products');
const AddProductPage = require('@pages/BO/catalog/products/add');
const ProductPage = require('@pages/FO/product');
const HomePage = require('@pages/FO/home');
const SearchResultsPage = require('@pages/FO/searchResults');

// Import data
const ProductFaker = require('@data/faker/product');

// Import test context
const testContext = require('@utils/testContext');

const baseContext = 'functional_BO_shopParameters_productSettings_productsStock_labelOutOfStock';

let browserContext;
let page;
const productData = new ProductFaker({type: 'Standard product', quantity: 0});

// Init objects needed
const init = async function () {
  return {
    loginPage: new LoginPage(page),
    dashboardPage: new DashboardPage(page),
    productSettingsPage: new ProductSettingsPage(page),
    productsPage: new ProductsPage(page),
    addProductPage: new AddProductPage(page),
    homePage: new HomePage(page),
    productPage: new ProductPage(page),
    searchResultsPage: new SearchResultsPage(page),
  };
};

describe('Set label out-of-stock with allowed/denied backorders', async () => {
  // before and after functions
  before(async function () {
    browserContext = await helper.createBrowserContext(this.browser);
    page = await helper.newTab(browserContext);

    this.pageObjects = await init();
  });

  after(async () => {
    await helper.closeBrowserContext(browserContext);
  });

  // Login into BO and go to products page
  loginCommon.loginBO();

  it('should go to \'Catalog > Products\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToProductsPage', baseContext);

    await this.pageObjects.dashboardPage.goToSubMenu(
      this.pageObjects.dashboardPage.catalogParentLink,
      this.pageObjects.dashboardPage.productsLink,
    );

    await this.pageObjects.productsPage.closeSfToolBar();

    const pageTitle = await this.pageObjects.productsPage.getPageTitle();
    await expect(pageTitle).to.contains(this.pageObjects.productsPage.pageTitle);
  });

  it('should go to create product page and create a product', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'createProduct', baseContext);

    await this.pageObjects.productsPage.goToAddProductPage();
    const validationMessage = await this.pageObjects.addProductPage.createEditBasicProduct(productData);
    await expect(validationMessage).to.equal(this.pageObjects.addProductPage.settingUpdatedMessage);
  });

  it('should go to \'Shop parameters > Product Settings\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToProductSettingsPage', baseContext);

    await this.pageObjects.addProductPage.goToSubMenu(
      this.pageObjects.addProductPage.shopParametersParentLink,
      this.pageObjects.addProductPage.productSettingsLink,
    );

    const pageTitle = await this.pageObjects.productSettingsPage.getPageTitle();
    await expect(pageTitle).to.contains(this.pageObjects.productSettingsPage.pageTitle);
  });

  const tests = [
    {
      args: {
        action: 'enable',
        enable: true,
        backordersAction: 'allowed',
        label: 'You can order',
        labelToCheck: 'You can order',
      },
    },
    {
      args: {
        action: 'enable', enable: true, backordersAction: 'allowed', label: ' ', labelToCheck: '',
      },
    },
    {
      args: {
        action: 'disable', enable: false, backordersAction: 'denied', label: ' ', labelToCheck: '',
      },
    },
    {
      args: {
        action: 'disable',
        enable: false,
        backordersAction: 'denied',
        label: 'Out-of-Stock',
        labelToCheck: 'Out-of-Stock',
      },
    },
  ];

  tests.forEach((test, index) => {
    it(`should ${test.args.action} allow ordering of out-of-stock products`, async function () {
      await testContext.addContextItem(
        this,
        'testIdentifier',
        `${test.args.action}AllowOrderingOutOfStock`,
        baseContext,
      );

      const result = await this.pageObjects.productSettingsPage.setAllowOrderingOutOfStockStatus(test.args.enable);
      await expect(result).to.contains(this.pageObjects.productSettingsPage.successfulUpdateMessage);
    });

    it(`should set Label of out-of-stock products with ${test.args.backordersAction} backorders`, async function () {
      await testContext.addContextItem(
        this,
        'testIdentifier',
        `setLabelOutOfStock${index}`,
        baseContext,
      );

      let result;

      if (test.args.enable) {
        result = await this.pageObjects.productSettingsPage.setLabelOosAllowedBackorders(test.args.label);
      } else {
        result = await this.pageObjects.productSettingsPage.setLabelOosDeniedBackorders(test.args.label);
      }

      await expect(result).to.contains(this.pageObjects.productSettingsPage.successfulUpdateMessage);
    });

    it('should check label out-of-stock', async function () {
      await testContext.addContextItem(
        this,
        'testIdentifier',
        `checkOrderingOutOfStock${test.args.action}`,
        baseContext,
      );

      page = await this.pageObjects.productSettingsPage.viewMyShop();
      this.pageObjects = await init();

      // Search and go to product
      await this.pageObjects.homePage.searchProduct(productData.name);
      await this.pageObjects.searchResultsPage.goToProductPage(1);

      // Check quantity and availability label
      const lastQuantityIsVisible = await this.pageObjects.productPage.isAddToCartButtonEnabled();
      await expect(lastQuantityIsVisible).to.be.equal(test.args.enable);

      const availabilityLabel = await this.pageObjects.productPage.getProductAvailabilityLabel();
      await expect(availabilityLabel).to.contains(test.args.labelToCheck);
    });

    it('should go back to BO', async function () {
      await testContext.addContextItem(this, 'testIdentifier', `goBackToBo${index}`, baseContext);

      page = await this.pageObjects.productPage.closePage(browserContext, 0);
      this.pageObjects = await init();

      const pageTitle = await this.pageObjects.productSettingsPage.getPageTitle();
      await expect(pageTitle).to.contains(this.pageObjects.productSettingsPage.pageTitle);
    });
  });

  it('should go to \'Catalog > Products\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToProductsPageToDeleteProduct', baseContext);

    await this.pageObjects.productSettingsPage.goToSubMenu(
      this.pageObjects.productSettingsPage.catalogParentLink,
      this.pageObjects.productSettingsPage.productsLink,
    );

    const pageTitle = await this.pageObjects.productsPage.getPageTitle();
    await expect(pageTitle).to.contains(this.pageObjects.productsPage.pageTitle);
  });

  it('should delete product', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'deleteProduct', baseContext);

    const deleteTextResult = await this.pageObjects.productsPage.deleteProduct(productData);
    await expect(deleteTextResult).to.equal(this.pageObjects.productsPage.productDeletedSuccessfulMessage);
  });

  it('should reset all filters', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'resetAllFilters', baseContext);

    await this.pageObjects.productsPage.resetFilterCategory();
    const numberOfProducts = await this.pageObjects.productsPage.resetAndGetNumberOfLines();
    await expect(numberOfProducts).to.be.above(0);
  });
});
