const asyncHandler = require("../../../utils/asyncHandler.utils");
const ApiError = require("../../../utils/ApiError.utils");
const ApiResponse = require("../../../utils/ApiResponse.utils");
const Cart = require("../../../models/cart.model");

const removefromcart = asyncHandler(async (req, resp) => {
  
  console.log("Hii by Delete from cart ", req.query.id);


  if (!req.user) {
    throw new ApiError(400, "Unautharized Request");
  }

  const cartId = req.query.id;

  if (!cartId) {
    throw new ApiError(400, "Cart Id Not Found");
  }

  const isExists = await Cart.exists({_id : "678d3bf0d5bb1910a6522aff"})


  console.log("here is existe ", isExists)

  const removedItem = await Cart.findByIdAndDelete(cartId);

  console.log("removedItem ",removedItem);

  if (!removedItem) {
    throw new ApiError(400, "Error in Deleting the Item From Cart");
  }

  const updatedCart = await Cart.aggregate([
    {
      $match: {
        UserId: req.user._id
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "ProdcutId",
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
        "Product.FrontImage": 1,
        "Product.Explaination": 1,
        "Product.Price": {
          $switch: {
            branches: [
              { case: { $eq: [req.user.UserType, "DEALER"] }, then: "$Product.PriceForDealers" },
              { case: { $eq: [req.user.UserType, "INSTALLER"] }, then: "$Product.PriceForInstallers" },
              { case: { $eq: [req.user.UserType, "CUSTOMER"] }, then: "$Product.PriceForCustomers" }
            ],
            default: "$Product.PriceForCustomers" // Handle other cases or mismatched UserTypes
          }
        }
      }
    }
  ]);

  if(!updatedCart){
    throw new ApiError(400, "Somthing Went Wrong While Getting Cart Items")
  }

  resp.status(200).json(new ApiResponse(200, {ProductsInCart: updatedCart}, "Item Deleted Successfully"));
});

module.exports = removefromcart;
