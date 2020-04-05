
const fs = require('fs');
const path = require('path');

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