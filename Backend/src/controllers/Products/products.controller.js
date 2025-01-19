const Product = require("../../models/product.model");
const {ObjectId} = require("mongodb")
const Cart = require("../../models/cart.model")
const asyncHandler = require("../../utils/asyncHandler.utils");
const ApiError = require("../../utils/ApiError.utils");
const ApiResponse = require("../../utils/ApiResponse.utils");
const { paginate, limit } = require("../../methods");

const serverProducts = asyncHandler(async (req, resp) => {
  const page = Number(req.query.page) || 0;
  const isFilterOn = req.query.filteron;
  const { MinPrice, MaxPrice, Premium, CameraType, PlaceOfInstallation, AreaSize, Brand, UserType } = req.body;
  
  const skipped = paginate(page, 15);
  if (isFilterOn === true) {
    const Products = await Product.aggregate([
      {
        $match: {
          $and: [
            {
              $or: [
                { PriceForDealers: { $gte: MinPrice, $lte: MaxPrice } },
                { PriceForInstallers: { $gte: MinPrice, $lte: MaxPrice } },
                { PriceForCustomers: { $gte: MinPrice, $lte: MaxPrice } },
              ]
            }
          ],
          Premium: Premium,
          CameraType: CameraType,
          Brand: Brand,
          PlaceOfInstallation: PlaceOfInstallation,
          InstallationAreaSize: AreaSize

        }
      },
      {
        $project: {
          _id: 1,
          ProductName: 1,
          PriceForDealers: {
            $cond: {
              if: { $eq: [UserType, "DEALER"] },
              then: "$PriceForDealers",
              else: "$$REMOVE"
            }
          },
          PriceForInstallers: {
            $cond: {
              if: { $eq: [UserType, "INSTALLER"] },
              then: "$PriceForInstallers",
              else: "$$REMOVE"
            }
          },
          PriceForCustomers: {
            $cond: {
              if: { $eq: [UserType, "CUSTOMER"] },
              then: "$PriceForCustomers",
              else: "$$REMOVE"
            }
          },
          Premium: 1,
          AdvancedPaymentAmmount: 1,
          Description: 1,
          FrontImage: 1,
          Explaination: 1
        }
      }
    ])

    if (!Products) {
      throw new ApiError(400, "Not Any Product Found With Filter");
    }

    resp.status(200).json(
      new ApiResponse(
        200,
        {
          Products,
          LimitPerPage: limit,
        },
        "Here All Products With Filter"
      )
    );
  }
  else {
    const Products = await Product.aggregate([
      {
        $project: {
          _id: 1,
          ProductName: 1,
          PriceForDealers: {
            $cond: {
              if: { $eq: [UserType, "DEALER"] },
              then: "$PriceForDealers",
              else: "$$REMOVE"
            }
          },
          PriceForInstallers: {
            $cond: {
              if: { $eq: [UserType, "INSTALLER"] },
              then: "$PriceForInstallers",
              else: "$$REMOVE"
            }
          },
          PriceForCustomers: {
            $cond: {
              if: { $eq: [UserType, "CUSTOMER"] },
              then: "$PriceForCustomers",
              else: "$$REMOVE"
            }
          },
          Premium: 1,
          AdvancedPaymentAmmount: 1,
          Description: 1,
          FrontImage: 1,
          Explaination: 1
        }
      }
    ]).skip(skipped).limit(limit);
    if (!Products) {
      throw new ApiError(400, "Not Any Product Found");
    }

    resp.status(200).json(
      new ApiResponse(
        200,
        {
          Products,
          LimitPerPage: limit,
        },
        "Here All Products"
      )
    );
  }
});

const serveSelectedProduct = asyncHandler(async (req, resp) => {
  const { ProductId, UserType } = req.body;

  if (!ProductId) {
    throw new ApiError(400, "Must Provide Product Id");
  }

  const Item = await Product.aggregate([
    {
      $match: {
        _id: new ObjectId (ProductId)
      }
    },
    {
      $project: {
        _id: 1,
        ProductName: 1,
        PriceForDealers: {
          $cond: {
            if: { $eq: [UserType, "DEALER"] },
            then: "$PriceForDealers",
            else: "$$REMOVE"
          }
        },
        PriceForInstallers: {
          $cond: {
            if: { $eq: [UserType, "INSTALLER"] },
            then: "$PriceForInstallers",
            else: "$$REMOVE"
          }
        },
        PriceForCustomers: {
          $cond: {
            if: { $eq: [UserType, "CUSTOMER"] },
            then: "$PriceForCustomers",
            else: "$$REMOVE"
          }
        },
        Premium: 1,
        AdvancedPaymentAmmount: 1,
        Description: 1,
        FrontImage: 1,
        Explaination: 1,
        AboutItem: 1
      }
    }
  ])
  if (!Item) {
    throw new ApiError(400, "Item Not Found");
  }
  
  resp.status(200)
    .json(new ApiResponse(200, { Product: Item }, "Here is the item"));

});

const serveCartItems = asyncHandler(async (req, resp) => {
  const page = Number(req.query.page) || 0;
  const skipped = paginate(page, 15);
  const { UserId, UserType } = req.body;

  const CartProducts = await Cart.aggregate([
    {
      $match: {
        UserId: UserId
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "ProductId",
        foreignField: "_id",
        as: "product"
      }
    },
    {
      $addFields: {
        Product: {
          $first: "$product"
        }
      }
    },
    {
      $project: {
        "Product.ProductName": 1,
        "Product.PriceForDealers": {
          $cond: {
            if: { $eq: [UserType, "DEALER"] },
            then: "$PriceForDealers",
            else: "$$REMOVE"
          }
        },
        "Product.PriceForInstallers": {
          $cond: {
            if: { $eq: [UserType, "INSTALLER"] },
            then: "$PriceForInstallers",
            else: "$$REMOVE"
          }
        },
        "Product.PriceForCustomers": {
          $cond: {
            if: { $eq: [UserType, "CUSTOMER"] },
            then: "$PriceForCustomers",
            else: "$$REMOVE"
          }
        },
        "Product.FrontImage": 1,
        "Product.Explaination": 1,
      }
    }
  ]).skip(skipped).limit(limit);

  if (!CartProducts) {
    throw new ApiError(400, "Cart Item Not Found");
  }

  resp.status(200)
    .json(new ApiResponse(200, {
      ProductsInCart: CartProducts,
      LimitPerPage: 15
    }))

});

module.exports = { serverProducts, serveSelectedProduct, serveCartItems }