#
# Based upon:
#	https://blog.bloomca.me/2017/12/15/how-to-push-folder-to-github-pages.html
#
#

REMOTE=`git remote get-url --push origin`
echo "REMOTE: ${REMOTE}"
echo "INIT_CWD: ${INIT_CWD}"
echo "PWD: ${PWD}"
echo "pwd: `pwd`"
# env
# exit

rm -rf dist
npm run build
cd dist
git init
git add .
git commit -m "Initial commit"
git remote add origin ${REMOTE}
git push --force origin master:gh-pages
