import {normalizePortfolio,portfolioSummary} from './portfolio.js';
export const BACKUP_LIMIT=50000000;
function checkSize(text){if(typeof text!=='string'||text.length>BACKUP_LIMIT||new TextEncoder().encode(text).byteLength>BACKUP_LIMIT)throw Error('Portfolio backup exceeds the supported 50 MB limit. Export projects individually.');}
export function portfolioBackup(portfolio,createdAt=new Date().toISOString()){
 const text=JSON.stringify({format:'uab-grant-portfolio',version:1,createdAt,portfolio:normalizePortfolio(portfolio)},null,2);checkSize(text);return text;
}
export function previewPortfolioRestore(text){
 checkSize(text);let value;try{value=JSON.parse(text)}catch{throw Error('This file is not valid JSON. Choose a portfolio backup (.json).')}
 if(value?.format!=='uab-grant-portfolio'||value.version!==1||typeof value.createdAt!=='string'||!Number.isFinite(Date.parse(value.createdAt)))throw Error('Choose a valid portfolio backup file.');
 const portfolio=normalizePortfolio(value.portfolio),summary=portfolioSummary(portfolio);
 return {portfolio,createdAt:value.createdAt,projectCount:portfolio.projects.length,archivedCount:portfolio.projects.filter(p=>p.archived).length,awardCount:summary.awardCount,proposalCount:summary.proposalCount};
}
