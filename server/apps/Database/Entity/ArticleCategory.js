const { Model, DataTypes } = require('sequelize');
const sequelize = require('../DatabaseConnection');

class ArticleCategory extends Model { }

ArticleCategory.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    modelName: 'ArticleCategory',
    tableName: 'tn_article_categories',
    timestamps: false
});

module.exports = ArticleCategory;

