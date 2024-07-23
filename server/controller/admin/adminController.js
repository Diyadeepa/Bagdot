const orderModel = require('../../model/orderModel');
const productModel=require('../../model/productModel');
const userDetails = require('../../model/useModel');
const bcrypt = require('bcrypt');
const fs = require("fs");
const os = require("os");
const path = require("path");
const puppeteer = require("puppeteer");

const admin = (req, res) => {
    try {
        console.log('admin initial page 1')
        if (req.session.admin) {
            console.log('admin initial page 2')
            res.redirect('/admin/adminHome');
        } else {
            console.log('admin initial page 3')
            const message = req.query.message
            res.render('adminLogin', { message: message });
        }
    } catch (e) {
        console.log('error in the admin : ', e);
        res.redirect('/admin/error');
    }
}
const checkAdmin = async (req, res) => {
    try {
        const adminFound = await userDetails.find({ Username: req.body.loginUsername })
        if (adminFound.length > 0) {
            if (adminFound[0].isAdmin) {
                const compass = await bcrypt.compare(req.body.loginPassword, adminFound[0].Password)
                if (compass) {
                    console.log('admin session created')
                    req.session.admin = true;
                    res.redirect('/admin/adminHome');
                } else {
                    res.redirect('/admin?message=wrong password')
                }
            } else {
                res.redirect('/admin');
            }
        } else {
            res.redirect('/admin?message=wrong admin name');
        }
        console.log(adminFound)
        console.log(req.body)
    } catch (e) {
        console.log('error in the checkAdmin controller', e);
        res.redirect('/admin/error',);
    }
}

const adminHome = async(req, res) => {
    try {
        console.log('adminHome rendered')
        const data = await userDetails.find({}).countDocuments();
        const product = await productModel.find({}).countDocuments();
        const order = await orderModel.find({}).countDocuments();
        // const orders = await orderModel.find({});

        const revenue = await orderModel.aggregate([
           
            {
                $unwind: "$products",
            },
            {
                $match: {
                    "products.userId": "Delivered",
                },
            },
            {
                $project: {
                    amount: {
                        $multiply: ["$products.Quantity", "$products.Price"],
                    },
                },
            },
            {
                $group: {
                    _id: "",
                    total_revenue: { $sum: "$amount" },
                },
            },
        ]);

        console.log(revenue,'revenue=============')

        const topProducts = await orderModel.aggregate([
            { $unwind: "$products" },
            {
                $group: {
                    _id: "$products.product",
                    totalQuantity: { $sum: "$products.Quantity" }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 5 }
        ]);

        const topCategories = await orderModel.aggregate([

                {
                  $unwind: "$products"  // Unwind the products array
                },
                {
                  $lookup: {
                    from: "products",  // Join with the products collection
                    localField: "products.product_id",  // Match by product_id
                    foreignField: "product_id",
                    as: "product_details"  // Output array field with product details
                  }
                },
                {
                  $unwind: "$product_details"  // Unwind the product details array
                },
                {
                  $group: {
                    _id: "$product_details.category",  // Group by category
                    totalQuantity: { $sum: "$products.Quantity" }  // Sum the quantities
                  }
                },
                {
                  $sort: { totalQuantity: -1 }  // Sort by total quantity sold in descending order
                },
                {
                  $limit: 2 // Limit to get the top-selling category
                }
              ]);
        console.log(topCategories,'topcategoriesssssssssssssss')
        console.log(topProducts,"topProducts++++++++++++++++++++")
        const topBrands = await orderModel.aggregate([
            { $unwind: "$products" },
            {
                $group: {
                    _id: "$products.brand",
                    totalQuantity: { $sum: "$products.quantity" }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 }
        ]);
        console.log("")
        
        res.render('adminHome',{data:data,product,order,topProducts,topCategories,revenue,})
    } catch (e) {
        console.log('error in the adminHome : ', e);
        res.redirect('/admin/error');
    }
}

const adminLogout = async (req, res) => {
    try {
        req.session.admin = false;
        await req.session.destroy()
        res.redirect('/admin');
    } catch (e) {
        console.log('error in the adminLogout : ', e);
        res.redirect('/admin/error');
    }
}
const salesReport = async (req, res) => {
    try {
        console.log("***salesReport***");
        const { startDate, endDate } = req.body;
        console.log("Start Date is:", startDate);
        console.log("End Date is:", endDate);

        console.log('1 ------------------------------------------------------------------------');

        // const Product = await orderModel.aggregate([
        //     {
        //         $match: {
        //             date: {
        //                 $gte: new Date(startDate),
        //                 $lte: new Date(endDate),
        //             },
        //         },
        //     },
        //     {
        //         $unwind: "$products",
        //     },
        //      {
        //         $match: { "status": "Delivered" },
        //     },
        //     {
        //         $group: {
        //             _id: "$products.product",
        //             totalOrders: { $sum: 1 },
        //         },
        //     },
        //     {
        //         $sort: { totalOrders: -1 },
        //     },
        //     {
        //         $limit: 3,
        //     },
        // ]);
        
        // console.log("Product details:", Product);
        console.log('2 ------------------------------------------------------------------------');

        const status = await orderModel.aggregate([
            {
                $match: {
                    date: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate),
                    },
                },
            },
            {
                $unwind: "$products",
            },
            {
                $group: {
                    _id: "$products.userId",
                    count: { $sum: 1 },
                },
            },
        ]);

        console.log(status,'3 ------------------------------------------------------------------------');

        const revenue = await orderModel.aggregate([
            {
                $match: {
                    date: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate),
                    },
                },
            },
            {
                $unwind: "$products",
            },
            {
                $match: {
                    "products.userId": "Delivered",
                },
            },
            {
                $project: {
                    amount: {
                        $multiply: ["$products.Quantity", "$products.Price"],
                    },
                },
            },
            {
                $group: {
                    _id: "",
                    total_revenue: { $sum: "$amount" },
                },
            },
        ]);

        console.log(revenue,'4 ------------------------------------------------------------------------');

        const orderData = await orderModel.aggregate([
            {
                $match: {
                    date: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate),
                    },
                },
            },
            {
                $unwind: "$products",
            },
            {
                $match: { "products.userId": "Delivered" },
            },
            {
                $sort: { date: 1 },
            },
        ]);

        console.log(orderData,'5 ------------------------------------------------------------------------');

        const totalRevenue = revenue.length > 0 ? revenue[0].total_revenue : 0;

        const htmlContent = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Sales Report - Bagdot</title>
                    <style>
                        body {
                            margin-right: 20px;
                        }
                    </style>
                </head>
                <body>
                    <h2 align="center"> Sales Report  Bagdot</h2>
                    From: ${startDate}<br>
                    To: ${endDate}<br>
                    <center>
                    <h3>Orders  </h3>
                        <table style="border-collapse: collapse;">
                            <thead>
                                <tr>
                                    <th style="border: 1px solid #000; padding: 8px;">#</th>
                                    <th style="border: 1px solid #000; padding: 8px;">User</th>
                                    <th style="border: 1px solid #000; padding: 8px;">DoO</th>
                                    <th style="border: 1px solid #000; padding: 8px;">Order ID</th>
                                    <th style="border: 1px solid #000; padding: 8px;">Shipped to</th>
                                    <th style="border: 1px solid #000; padding: 8px;">Product Name</th>
                                    <th style="border: 1px solid #000; padding: 8px;">Rate</th>
                                    <th style="border: 1px solid #000; padding: 8px;">Qty</th>
                                    <th style="border: 1px solid #000; padding: 8px;">Paid By</th>
                                    
                                </tr>
                            </thead>
                            <tbody>
                                ${orderData.map(
            (item, index) => `
                                    <tr>
                                        <td style="border: 1px solid #000; padding-left: 8px;">${index + 1}</td>
                                        <td style="border: 1px solid #000; padding: 8px;">${item.user}</td>
                                        <td style="border: 1px solid #000; padding: 8px;">${item.date.toLocaleDateString()}</td>
                                        <td style="border: 1px solid #000; padding: 8px;">${item.orderID}</td>
                                        <td style="border: 1px solid #000; padding: 8px;">${item.address.Name}</td>
                                        <td style="border: 1px solid #000; padding: 8px;">${item.products.product}</td>
                                        <td style="border: 1px solid #000; padding: 8px;">${item.products.Price}</td>
                                        <td style="border: 1px solid #000; padding: 8px;">${item.products.Quantity}</td>
                                        <td style="border: 1px solid #000; padding: 8px;">${item.paymentMethod}</td>
                                        
                                    </tr>`
        )}
                            </tbody>
                        </table>
                    </center>
                    <br>
                    <center>
                    <h3>Order Status</h3>
                        <table style="border-collapse: collapse;">
                            <thead>
                                <tr>
                                    <th style="border: 1px solid #000; padding: 8px;">#</th>
                                    <th style="border: 1px solid #000; padding: 8px;">Status</th>
                                    <th style="border: 1px solid #000; padding: 8px;">Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${status.map(
            (item, index) => `
                                    <tr>
                                        <td style="border: 1px solid #000; padding: 8px;">${index + 1}</td>
                                        <td style="border: 1px solid #000; padding: 8px;">${item._id}</td>
                                        <td style="border: 1px solid #000; padding: 8px;">${item.count}</td>
                                    </tr>`
        )}
                            </tbody>
                        </table>
                    </center>
                    <br>
                    <center>
                    <h3>Total Revenue generated: <span>₹ ${totalRevenue}</span></h3>
                    </center>
                    <p style="padding-left:20px;">Summary:<br>A total of ${orderData.length} products have been delivered. Total revenue generated is worth ₹ ${totalRevenue}.  </p>
                </body>
                </html>
            `;

            if (format === "pdf") {
                // Generate PDF
                const browser = await puppeteer.launch({
                  executablePath: '/usr/bin/chromium-browser'
                })
                const page = await browser.newPage();
                await page.setContent(htmlContent);
                const pdfBuffer = await page.pdf();
                await browser.close();
          
                // Set headers for PDF
                res.setHeader("Content-Length", pdfBuffer.length);
                res.setHeader("Content-Type", "application/pdf");
                res.setHeader("Content-Disposition", "attachment; filename=sales.pdf");
                res.status(200).end(pdfBuffer);
              } else if (format === "excel") {
                // Create a new Excel workbook
                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet("Sales Report");
          
                // Add headers for total sales
          const salesHeaderRow = worksheet.addRow(["Product Name", "Product Price", "Product Offer Price", "Total Orders"]);
          salesHeaderRow.eachCell({ includeEmpty: true }, (cell) => {
              cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFFF00' } // Yellow fill color
              };
          });
          
          // Add data for total sales
          Product.forEach((item) => {
              worksheet.addRow([item._id, item.price, item.Offerprice, item.totalOrders]);
          });
          
          // Add empty row
          worksheet.addRow();
          
          // Add headers for order status
          const statusHeaderRow = worksheet.addRow(["Status", "Total Count"]);
          statusHeaderRow.eachCell({ includeEmpty: true }, (cell) => {
              cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFA07A' } // Light salmon fill color
              };
          });
          
          // Add data for order status
          status.forEach((item) => {
              worksheet.addRow([item._id, item.count]);
          });
          
          // Add empty row
          worksheet.addRow();
          
          // Add total orders, total amount, and total discount amount
          worksheet.addRow(["Total Orders:", count]);
          worksheet.addRow(["Total Amount:", totalDiscount.length > 0 ? totalDiscount[0].price : 0]);
          worksheet.addRow(["Total Discount Amount:", totalDiscount.length > 0 ? totalDiscount[0].price - totalDiscount[0].totalDiscount : 0]);
          
          
                // Set the content type and headers for the response for Excel
                res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                res.setHeader("Content-Disposition", "attachment; filename=sales.xlsx");
          
                // Write the Excel workbook to the response
                const excelBuffer = await workbook.xlsx.writeBuffer();
                res.status(200).end(excelBuffer);
              } else {
                res.status(400).send("Invalid report format selected.");
              }
          
            } catch (error) {
              console.log(
                "Error happened between salesReport in adminController ",
                error
              );
            }
          };
          


const getSalesData = async (req, res) => {
    try {
        console.log("getSalesData");
        const { filter } = req.query;
        console.log("filter--------->>>", filter);
        let salesData = {};
        if (filter === "yearly") {
            salesData = await getYearlySalesData();
        } else if (filter === "monthly") {
            salesData = await getMonthlySalesData();
        } else if (filter === "daily") {
            salesData = await getDailySalesData();
        } else {
            throw new Error("Invalid filter parameter");
        }
        res.json(salesData);
    } catch (error) {
        console.log("Error while getSalesData in adminController", error);
    }
};




async function getDailySalesData() {
    const Aggregation = await orderModel.aggregate([
        {
            $match: {
                date: { $exists: true },
            },
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                count: { $sum: 1 },
            },
        },
        {
            $sort: { _id: 1 },
        },
    ]);
    console.log("Aggregation value for daily graph is: ", Aggregation);

    const saleDate = Aggregation.map((item) => item._id);
    const count = Aggregation.map((item) => item.count);
    return { saleDate, count };
}




async function getMonthlySalesData() {
    const Aggregation = await orderModel.aggregate([
        {
            $match: {
                date: { $exists: true },
            },
        },
        {
            $group: {
                _id: {
                    year: { $year: "$date" },
                    month: { $month: "$date" },
                },
                count: { $sum: 1 },
            },
        },
        {
            $sort: {
                "_id.year": 1,
                "_id.month": 1,
            },
        },
    ]);

    console.log("Aggregation value for monthly graph is: ", Aggregation);
    const saleDate = Aggregation.map((item) => item._id.month);
    const count = Aggregation.map((item) => item.count);
    return { saleDate, count };
}



async function getYearlySalesData() {
    const getYearlySalesData = await orderModel.aggregate([
        {
            $match: {
                date: { $exists: true },
            },
        },
        {
            $group: {
                _id: {
                    year: { $year: "$date" },
                },
                count: { $sum: 1 },
            },
        },

    ]);

    console.log("Aggregation value for yearly graph is: ", getYearlySalesData);
    const saleDate = getYearlySalesData.map((item) => item._id.year);
    const count = getYearlySalesData.map((item) => item.count);
    return { saleDate, count };
}


module.exports = {
    admin,
    checkAdmin,
    adminHome,
    adminLogout,
    salesReport,
    getSalesData
}