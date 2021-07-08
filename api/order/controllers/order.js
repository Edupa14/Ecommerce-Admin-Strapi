"use strict";
const stripe = require("stripe")(
  "sk_test_51J9bHsCF4Sf3ag8y2bnkqRFsFOA456CsoAmtbtoxjWACpfAYZIqbilDSrn2cZXNpS1ZjEKvcq2LQpLxrJw0Es7YB00u7y8DbEp"
);

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async create(ctx) {
    const calcPrice = (price, discount) => {
      if (!discount) return price;
  
      const discountAmount = (price * discount) / 100;
      return (price - discountAmount).toFixed(2);
    };
    
    const { tokenStripe, products, idUser, addressShipping } = ctx.request.body;
    let totalPayment = 0;
    products.forEach((product) => {

      const price = calcPrice(product.price, product.discount);

      totalPayment += price * product.quantity;

    });

    const charge = await stripe.charges.create({
      amount: totalPayment * 100,
      currency: "pen",
      source: tokenStripe,
      description: `ID Usuario: ${idUser}`,
    });

    const createOrder = [];
    for await (const product of products) {
      const data = {
        product: product.id,
        user: idUser,
        totalPayment: totalPayment,
        productsPayment: product.price * product.quantity,
        quantity: product.quantity,
        idPayment: charge.id,
        addressShipping,
      };

      const validData = await strapi.entityValidator.validateEntityCreation(
        strapi.models.order,
        data
      );
      const entry = await strapi.query("order").create(validData);
      createOrder.push(entry);
    }

    return createOrder;
  },
};
