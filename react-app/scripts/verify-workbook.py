"""Read-only QA for an app-exported XLSX. Requires openpyxl; never rewrites it."""
import argparse
from decimal import Decimal
from zipfile import ZipFile
from openpyxl import load_workbook
parser=argparse.ArgumentParser()
parser.add_argument('path')
args=parser.parse_args()
with open(args.path,'rb') as source:
    workbook=load_workbook(source,data_only=False)
required={'Summary','Ledger','Entries','Personnel','Effort','Supplies','Subaward summary','Subaward payments','Assumptions','Audit','Milestones','Reconciliation','Commitments','Rate changes','Import batches','Budget periods','Posted F&A'}
assert required <= set(workbook.sheetnames), required-set(workbook.sheetnames)
with ZipFile(args.path) as archive:
    assert archive.testzip() is None
    assert not any('externalLinks/' in name for name in archive.namelist())
for sheet in workbook:
    for row in sheet:
        for cell in row:
            assert cell.data_type != 'f', (sheet.title,cell.coordinate,'unexpected formula')
            assert cell.hyperlink is None, (sheet.title,cell.coordinate,'unexpected live link')
summary={r[0]:r[1:] for r in workbook['Summary'].values if r[0] in {'Total direct costs','Indirect (IDC)','Total'}}
for column in range(4):
    direct=Decimal(str(summary['Total direct costs'][column]))
    indirect=Decimal(str(summary['Indirect (IDC)'][column]))
    assert direct+indirect==Decimal(str(summary['Total'][column]))
assert Decimal(str(summary['Total'][0]))-Decimal(str(summary['Total'][2]))==Decimal(str(summary['Total'][3]))
for row in list(workbook['Posted F&A'].values)[1:]:
    month,posted,status,estimate,difference=row
    if status=='Not entered':assert posted in ('',None) and difference in ('',None),month
    else:assert round(Decimal(str(posted))-Decimal(str(estimate)),2)==Decimal(str(difference)),month
print(f'PASS: {len(workbook.sheetnames)} readable sheets; totals reconcile; no formulas/external links; F&A missing values preserved.')
print('This does not verify visual layout or native Microsoft Excel behavior.')
