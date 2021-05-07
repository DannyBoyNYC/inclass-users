# Users

```sh
docker run --name my-postgres -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 -d --rm postgres:13.0
docker exec -it -u postgres my-postgres psql
```
