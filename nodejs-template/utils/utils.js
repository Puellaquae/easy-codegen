/**
 *
 * @param {string} src
 * @param {string} pattern
 * @return {string}
 */
function like(str, pattern) {
    // 把通配符转义
    pattern = pattern.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1');

    // 把 % 转成 .*，把 _ 转成 .
    pattern = pattern.replace(/%/g, '.*').replace(/_/g, '.');

    // 使用正则表达式匹配字符串
    const regex = new RegExp('^' + pattern + '$', 'i');
    return regex.test(str);
}

/**
 *
 * @param {T[]} arr
 * @returns {T}
 */
function sum(arr) {
    return arr.reduce((p, c, _i, _a) => p + c);
}

export {
    like, sum
}