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

openfile = sys.argv[1] if len(sys.argv) > 1 else "processing-data/input.ecg"
openfile = os.path.relpath(openfile, "processing-data/")

dout1 = openfile + "d1"
lout1 = openfile + "l1"
rout1 = openfile + "r1"

codePreprocess(openfile, dout1, lout1, rout1)

dout2 = openfile + "d2"

dslParser(dout1, dout2)

os.remove(os.path.join("./processing-data/", dout1))

douts = openfile + ".sql"
douti = openfile + "d3"

codeGen(dout2, douts, douti)

os.remove(os.path.join("./processing-data/", dout2))

