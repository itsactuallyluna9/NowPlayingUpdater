compile:
    deno task compile:win

edit_version version:
    sed -i bak 's/^const version = "v.*";/const version = "v{{version}}";/' ./main.ts

tag version:
    just edit_version {{ version }}
    just compile
    git add main.ts; git commit -m "update version to v{{ version }}"
    git tag v{{ version }}
    git push origin v{{ version }}
    gh release create v{{ version }} --generate-notes --draft './nowplayingupdater.exe'
