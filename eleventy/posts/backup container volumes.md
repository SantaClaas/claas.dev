---
title: Backup container volumes
---

# Introduction

This is a short one and is based on [Christian Lempa's YouTube video on backing up container volumes](https://youtu.be/ZEy8iFbgbPA). That video helped me quickly understand all the cryptic parts of that command. You can find the [command to backup](https://docs.docker.com/engine/storage/volumes/#back-up-restore-or-migrate-data-volumes) in the Docker documentation, but I wanted to have it written down for myself and future reference.

This command uses podman as that is what NixOS uses to run containers and I happen to use NixOS on my server. But as it is usual with podman, you can run the same command with docker.

# Command

```bash
podman run --rm --volumes-from CONTAINER -v $(pwd):/backup ubuntu tar cvfz /backup/backup.tar /data
```

# This command does:

1. `podman run` runs a new container
2. [`--rm`](https://docs.docker.com/reference/cli/docker/container/run/#rm) this makes our container temporary and automatically cleans up the container after it has run.
3. [`--volumes-from CONTAINER`](https://docs.docker.com/reference/cli/docker/container/run/#volumes-from) attaches all volumes used by the container we want to backup from the container named `CONTAINER`. Replace this with your container name which you can look up with `podman ps`.
4. [`-v $(pwd):/backup`](https://docs.docker.com/reference/cli/docker/container/run/#volume) binds a volume in the process working directory (pwd) as a volume in our temporary container under the path `/backup`. This is where we are going to store the backup.
5. `ubuntu` is the image we are using to run the backup command in. You can choose a more lightweight image like `busybox` if you want but I don't really care about the potentially small performance improvement for this and prefer using something I am more familiar with.
6. `tar cvfz` collects all files and archives them in a single file for our convenience. `cvfz` is a list of options we pass to the command.
   - `c` (create) instructs tar to create a new archive.
   - `v` (verbose) instructs tar to put out more information
   - `f` (file) instructs tar to put the archive into a file. (I assume in contrast to standard out?)
   - `z` (gzip) instructs tar to compress the file using gzip to reduce its size which is useful for our backup as we probably want to move it to another machine in case the current one goes up in smoke. This is not in the official docker documentation.
7. `/backup/backup.tar` is where tar should store the file. This puts it through the mount binding to the process working directory right into the directory from which we execute this command.
8. `/data` is the last path that tells tar where the data to be backed up is in. This should be the directory inside the container where your container stores the data that would be lost if it was completely destroyed including its volumes.

# Example

As I did this to back up a Core Keeper Game Server this is what I used it for:

```bash
podman run --rm --volumes-from coreKeeperGameServer -v $(pwd):/backup ubuntu tar cvfz /backup/backup.tar /home/steam/core-keeper-data
```

If you need to backup multiple direcotries or files you should be able to just append them separated with a space.
Also note that I needed to run this as sudo as the container under NixOS runs under the system.
Additionally if I wanted to have access to the file as I created it with privileges I needed to change the ownership with `chown claas backup.tar` using sudo.
If you want to copy the backup to another machine you can use the `scp` (secure copy) command. This would copy it from the server to your local machine's current directory `scp username@server:/home/username/backup.tar .`. You can also use this to copy the file from server to server. Replace username and server with the same paramters you'd use for SSH.
