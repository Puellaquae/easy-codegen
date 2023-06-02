import os
import subprocess
import sys


def codePreprocess(infile, dout, lout, rout):
    ret = subprocess.call(shell=True, args=[
        "npm", "run", "run", "--", "-i", infile, "--od", dout, "--ol", lout, "--or", rout], cwd="./code-preprocess")
    if ret != 0:
        exit(ret)


def dslParser(din, dout):
    rsinfile = os.path.normpath(os.path.join("../../processing-data", din))
    rsoutfile = os.path.normpath(os.path.join("../processing-data", dout))
    print(rsinfile)
    print(rsoutfile)

    with open("./dsl-parser/config/in.txt", "w") as f:
        f.write(rsinfile)
    with open("./dsl-parser/config/out.txt", "w") as f:
        f.write(rsoutfile)

    ret = subprocess.call(
        shell=True, args=["cargo", "run"], cwd="./dsl-parser")
    if ret != 0:
        exit(ret)


def codeGen(din, dsout, diout):
    ret = subprocess.call(
        shell=True, args=["dotnet", "run", "--in", din, "--sqlout", dsout, "--infout", diout], cwd="./codegen/CodeGen")
    if ret != 0:
        exit(ret)


def logicGen(din, tin, dout, sout):
    ret = subprocess.call(shell=True,
                          args=[
                              "node", "index.js", "--tbl", os.path.join("../processing-data", tin), "--dsl", os.path.join(
                                  "../processing-data", din), "--odao", os.path.join("../processing-data", dout), "--oservice", os.path.join("../processing-data", sout)
                          ],
                          cwd="./type-resolver")
    if ret != 0:
        exit(ret)


openfile = sys.argv[1] if len(sys.argv) > 1 else "processing-data/input.ecg"
openfile = os.path.relpath(openfile, "processing-data/")

dout1 = openfile + "d1"
lout1 = openfile + "l1"
rout1 = openfile + "r1"

print("DSL FILE = {openfile} |> CODE PREPROCESS |> DATA_S1 = {dout1}, LOGIC_S1 = {lout1}, ROUTE_S1 = {rout1}".format(
    openfile=openfile, dout1=dout1, lout1=lout1, rout1=rout1))

codePreprocess(openfile, dout1, lout1, rout1)

dout2 = openfile + "d2"

print("DATA_S1 = {dout1} |> DATA PROCESS STAGE 1 |> DATA_S2 = {dout2}".format(
    dout1=dout1, dout2=dout2))

dslParser(dout1, dout2)

print("CLEAR <| DATA_S1 = {dout1}".format(dout1=dout1))

os.remove(os.path.join("./processing-data/", dout1))

douts = openfile + ".sql"
douti = openfile + "d3"

print(
    "DATA_S2 = {dout1} |> DATA PROCESS STAGE 2 |> DATA_SQL = {douts}, DATA_JSON = {douti}".format(dout1=dout1, douts=douts, douti=douti))

codeGen(dout2, douts, douti)

print("CLEAR <| DATA_S2 = {dout2}".format(dout2=dout2))

os.remove(os.path.join("./processing-data/", dout2))

ldout = openfile + ".dao.js"
lsout = openfile + ".service.js"

print(
    "LOGIC_S1 = {lout1}, DATA_JSON = {douti} |> LOGIC PROCESS |> DAO_JS = {ldout}, SERVICE_JS = {lsout}".format(lout1=lout1, douti=douti, ldout=ldout, lsout=lsout))

logicGen(lout1, douti, ldout, lsout)

print("CLEAR <| DATA_JSON = {douti}".format(
    lout1=lout1, douti=douti))

os.remove(os.path.join("./processing-data/", douti))


