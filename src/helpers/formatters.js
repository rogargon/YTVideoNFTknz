import MaterialIcon from 'material-icons-react';
import {Tooltip} from "antd";

export const n6 = new Intl.NumberFormat("en-us", {
  style: "decimal",
  minimumFractionDigits: 0,
  maximumFractionDigits: 6,
});
export const n4 = new Intl.NumberFormat("en-us", {
  style: "decimal",
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
});

export const c2 = new Intl.NumberFormat("en-us", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Returns a string of form "abc...xyz"
 * @param {string} str string to string
 * @param {number} n number of chars to keep at front/end
 * @returns {string}
 */
export const getEllipsisTxt = (str, n = 6) => {
  if (str) {
    return `${str.substr(0, n)}...${str.substr(str.length - n, str.length)}`;
  }
  return "";
};

export const tokenValue = (value, decimals) => (decimals ? value / Math.pow(10, decimals) : value);

/**
 * Return a formatted string with the symbol at the end
 * @param {number} value integer value
 * @param {number} decimals number of decimals
 * @param {string} symbol token symbol
 * @returns {string}
 */
export const tokenValueTxt = (value, decimals, symbol) => `${n4.format(tokenValue(value, decimals))} ${symbol}`;

export const nftEvent = (token, row) => {
    if (row.from_address === '0x0000000000000000000000000000000000000000') {
        return (<Tooltip title="Mint"><MaterialIcon icon="child_friendly"/></Tooltip>);
    } else if (row.to_address === '0x0000000000000000000000000000000000000000') {
        return (<Tooltip title="Burn"><MaterialIcon icon="local_fire_department"/></Tooltip>);
    } else {
        return (<Tooltip title="Transfer"><MaterialIcon icon="local_shipping"/></Tooltip>);
    }
}
export const dateTime = (dateTime) => {
    return dateTime.replace('T', ' ').replace('.000Z', '');
}
