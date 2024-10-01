compile:
    deno compile --allow-net --allow-write --target x86_64-pc-windows-msvc -o nowplayingupdater.exe ./main.ts

upload: compile
    curl -F "file=@nowplayingupdater.exe" https://temp.sh/upload