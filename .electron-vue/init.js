
const fs = require('fs');
const path = require('path');

// 初始化版本
function initVersion() {
    fs.readFile(path.join(__dirname, '../package.json'), function (err, data) {
        if (err) {
            return err;
        }
        const config = JSON.parse(data.toString())
        replaceFile(
            path.join(__dirname, '../src/renderer/settings.js'),
            /version: '[0-9.]*'/g,
            `version: '` + config.version + `'`
        )
    })
}

//读取文件，并且替换文件中指定的字符串
function replaceFile (filePath, sourceRegx, targetStr) {
    fs.readFile(filePath, function (err, data) {
        if (err) {
            return err;
        }
        let str = data.toString();
        str = str.replace(sourceRegx, targetStr);
        fs.writeFile(filePath, str, function (err) {
            if (err) return err;
        });
    });
}
replaceFile(
    path.join(__dirname, '../node_modules/sequelize/lib/dialects/mssql/query.js'),
    /execSql\(/g,
    'execSqlBatch('
)

initVersion()