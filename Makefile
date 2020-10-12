.PHONY: git
git:
	npm run init
	git add .
	git commit -m"自动提交 git 代码"
	git push
tag:
	git push --tags
.PHONY: run
run:
	npm run init
	npm run dev
