import os
import subprocess
import sys

openfile = sys.argv[1] if len(sys.argv) > 1 else "processing-data/input.ecg"
openfile = os.path.relpath(openfile, "processing-data/")

outfile1 = openfile + "1"
outfile2 = openfile + "2"
outfile3 = openfile + "3"

ret = subprocess.call(shell=True, args=[
                      "npm", "run", "run", "--", "-i", openfile, "-o", outfile1], cwd="./code-preprocess")
if ret != 0:
    exit(ret)


rsinfile = os.path.normpath(os.path.join("../../processing-data", outfile1))
rsoutfile = os.path.normpath(os.path.join("../processing-data", outfile2))
print(rsinfile)
print(rsoutfile)

with open("./dsl-parser/config/in.txt", "w") as f:
    f.write(rsinfile)
with open("./dsl-parser/config/out.txt", "w") as f:
    f.write(rsoutfile)

ret = subprocess.call(shell=True, args=["cargo", "run"], cwd="./dsl-parser")
if ret != 0:
    exit(ret)

ret = subprocess.call(
    shell=True, args=["dotnet", "run", "--in", outfile2], cwd="./codegen/CodeGen")
if ret != 0:
    exit(ret)

