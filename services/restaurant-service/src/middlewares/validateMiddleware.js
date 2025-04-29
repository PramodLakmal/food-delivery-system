const { body, validationResult } = require("express-validator");

exports.validateRestaurant = [
    body("name").notEmpty().withMessage("Name is required"),
    body("location").notEmpty().withMessage("Location is required"),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        next();
    }
];

exports.validateMenu = [
    body("name").notEmpty().withMessage("Menu item name is required"),
    body("price").isFloat({ gt: 0 }).withMessage("Price must be a positive number"),
    body("category")
        .optional()
        .isIn(["Starter", "Main", "Dessert", "Drink", "Other"])
        .withMessage("Invalid category"),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        next();
    }
];
