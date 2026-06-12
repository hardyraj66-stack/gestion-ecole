// Script d'initialisation MongoDB.
//
// IMPORTANT : Mongo n'exécute les scripts de /docker-entrypoint-initdb.d QUE lors de
// l'initialisation d'un volume de données VIERGE. Sur un volume existant (cas normal en
// production), ce fichier est ignoré — les utilisateurs y ont été créés manuellement.
//
// À ce stade, le user root a déjà été créé par MONGO_INITDB_ROOT_USERNAME/PASSWORD.
// On crée ici le user applicatif à privilèges limités (lecture/écriture sur la seule
// base métier), dans la base `admin` → authSource=admin, cohérent avec le user root.
const appUser = process.env.MONGO_APP_USER;
const appPwd = process.env.MONGO_APP_PASSWORD;
const appDb = process.env.MONGO_APP_DB;

if (appUser && appPwd && appDb) {
  const admin = db.getSiblingDB('admin');
  admin.createUser({
    user: appUser,
    pwd: appPwd,
    roles: [
      { role: 'readWrite', db: appDb },
      { role: 'dbAdmin', db: appDb },
    ],
  });
  print(`[mongo-init] utilisateur applicatif '${appUser}' créé (readWrite+dbAdmin @ ${appDb})`);
} else {
  print('[mongo-init] variables MONGO_APP_* absentes — création du user applicatif ignorée');
}
