'use strict';

const pool = require('../config/config').pool;
const mysql = require('mysql');

/**
 * existingCustomer
 * @param: user_data = { ip, device_id, device_type }
 */
exports.existingCustomer = (user_data) => {
  return new Promise((resolve, reject) => {
      const sql =
        `
        SELECT *
        FROM tbl_user
        WHERE ip = ? AND device_id = ? AND device_type = ?
        `;
      pool.query(sql, [user_data.ip, user_data.device_id, user_data.device_type], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          if(rows.length > 0){
            var userinfo = rows[0];
            if (userinfo.full_name === null ||  (userinfo.full_name + "").toString().trim() === '' ||
                userinfo.email === null ||  (userinfo.eamil + "").toString().trim() === '' ||
                userinfo.birth === null || (userinfo.birth + "").toString().trim() === '' ||
                userinfo.tel === null ||  (userinfo.tel + "").toString().trim() === '' ||
                userinfo.zip_code === null ||  (userinfo.zip_code + "").toString().trim() === '' ||
                userinfo.favorite_topic === null || (userinfo.favorite_topic + "").toString().trim() === ''
                ){
              resolve({logined: false});
            }
            const sql =
              `
                UPDATE tbl_user SET last_visited = now() WHERE tbl_user.id = 1
              `;
            pool.query(sql, user_data, (err, rows) => {
              if (err) {
                reject(err);
              } else {
                if (rows.affectedRows === 1) {
                  resolve({logined: true});
                } else {
                  const _err = new Error("User visited Write Error");
                  reject(_err);
                }
              }
            });
          }
          else {
            resolve({logined: false});
          }
        }
      });
    }
  );
};


/**
 * Fetch All Users for Admin
 
 */

exports.AllUsers = () => {
  return new Promise((resolve, reject) => {
    const sql =
          `
            SELECT * FROM tbl_user
          `;
    
    pool.query(sql, async (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve (rows);
      }
    });
  });
}

/**
 * Create User for first user
 * @param: user_data = { ip, device_id, device_type }
 */

function getchat_id () {
  return new Promise((resolve, reject) => {
    const sql =
          `
            SELECT auto_increment FROM INFORMATION_SCHEMA.TABLES
            WHERE table_name = 'tbl_user'
          `;
    
    pool.query(sql, async (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve (rows[0].auto_increment);
      }
    });
  });
}

exports.login = async (user_data) =>{
  return new Promise((resolve, reject) => {
    const sql =
      `
      SELECT device_id, device_type, ip, chat_id FROM tbl_user WHERE tbl_user.email = ? AND tbl_user.full_name = ? 
      `;
      pool.query(sql, [user_data.email, user_data.name], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          if (rows.length == 0){
            resolve(false);
          }
          else resolve({
            device_id : rows[0].device_id != undefined ? rows[0].device_id : "",
            device_type : rows[0].device_type,
            ip : rows[0].ip,
            chat_id : rows[0].chat_id
          });
        }
      });
  })
}

exports.createUser = async (user_data) => {
    return new Promise((resolve, reject) => {
      getchat_id().then(chat_id_random => {
      console.log(chat_id_random);  
      const sql =
          `
          INSERT INTO tbl_user (ip, device_id, device_type, chat_id, step_id) VALUES (?, ?, ?, ?, 1)
          `;
        pool.query(sql, [user_data.ip, user_data.device_id, user_data.device_type, chat_id_random], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            if (rows.affectedRows === 1) {
              let insertId = rows.insertId;
              const sql =
                `
                SELECT * FROM tbl_user WHERE id = ?
                `;
              pool.query(sql, insertId, (err, rows) => {
                if (err) {
                  reject(err);
                } else {
                  resolve({
                    device_id : rows[0].device_id,
                    device_type : rows[0].device_type,
                    ip : rows[0].ip,
                    chat_id : rows[0].chat_id
                  });
                }
              });
            }
          }
        });
    });
  });
}

exports.step_id_increase = (user_id, step_id) => {
  step_id = parseInt(step_id) + 1;
  return new Promise((resolve, reject) => {
    const sql =
      `
      UPDATE tbl_user SET step_id = ? WHERE id = ?
      `;
    pool.query(sql, [step_id, user_id], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        if (rows.affectedRows === 1) {
          resolve(step_id);
        }
      }
    });
  });
}

exports.addFirstName = (user_id, name) => {
  return new Promise((resolve, reject) => {
    const sql =
      `
      UPDATE tbl_user SET first_name = ? WHERE id = ?
      `;
    pool.query(sql, [name, user_id], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        if (rows.affectedRows === 1) {
          resolve(true);
        }
      }
    });
  });
}

exports.addLastName = (user_id, name) => {
  return new Promise((resolve, reject) => {
    const sql =
      `
      UPDATE tbl_user SET last_name = ? WHERE id = ?
      `;
    pool.query(sql, [name, user_id], async (err, rows) => {
      if (err) {
        reject(err);
      } else {
        if (rows.affectedRows === 1) {
          await updateFullName(user_id);
          resolve(true);
        }
      }
    });
  });
}

const updateFullName = (user_id)=>{
  return new Promise((resolve, reject) => {
    const sql =
      `
      UPDATE tbl_user SET full_name = CONCAT(first_name,' ',last_name) where id = ?
      `;
    pool.query(sql, user_id, async(err, rows) => {
      if (err) {
        reject(err);
      } else {
        if (rows.affectedRows === 1) {
          resolve(true);
        }
      }
    });
  });
}

exports.addNickName = (user_id, nickname) => {
  return new Promise((resolve, reject) => {
    const sql =
      `
      UPDATE tbl_user SET nick_name = ? WHERE id = ?
      `;
    pool.query(sql, [nickname, user_id], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        if (rows.affectedRows === 1) {
          resolve(true);
        }
      }
    });
  });
}

function date2str(x, y) {
  var z = {
      M: x.getMonth() + 1,
      d: x.getDate(),
      h: x.getHours(),
      m: x.getMinutes(),
      s: x.getSeconds()
  };
  y = y.replace(/(M+|d+|h+|m+|s+)/g, function(v) {
      return ((v.length > 1 ? "0" : "") + eval('z.' + v.slice(-1))).slice(-2)
  });

  return y.replace(/(y+)/g, function(v) {
      return x.getFullYear().toString().slice(-v.length)
  });
}

exports.addBirthday = (user_id, birthday) => {
  birthday = date2str(new Date(birthday), 'yyyy-MM-dd');
  return new Promise((resolve, reject) => {
    const sql =
      `
      UPDATE tbl_user SET birth = ? WHERE id = ?
      `;
    pool.query(sql, [birthday, user_id], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        if (rows.affectedRows === 1) {
          resolve(true);
        }
      }
    });
  });
}


exports.addHoroscope = (user_id) => {
  return new Promise((resolve, reject) => {
    const sql =
      `
      UPDATE tbl_user SET daily_horoscope = 1 WHERE id = ?
      `;
    pool.query(sql, user_id, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        if (rows.affectedRows === 1) {
          resolve(true);
        }
      }
    });
  });
}

exports.addTel = (user_id, tel) => {
  return new Promise((resolve, reject) => {
    const sql =
      `
      UPDATE tbl_user SET tel = ? WHERE id = ?
      `;
    pool.query(sql, [tel, user_id], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        if (rows.affectedRows === 1) {
          resolve(true);
        }
      }
    });
  });
}

exports.addEmail = (user_id, email) => {
  return new Promise((resolve, reject) => {
    const sql =
      `
      UPDATE tbl_user SET email = ? WHERE id = ?
      `;
    pool.query(sql, [email, user_id], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        if (rows.affectedRows === 1) {
          resolve(true);
        }
      }
    });
  });
}

exports.addPostalCode = (user_id, postalcode) => {
  return new Promise((resolve, reject) => {
    const sql =
      `
      UPDATE tbl_user SET zip_code = ? WHERE id = ?
      `;
    pool.query(sql, [postalcode, user_id], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        if (rows.affectedRows === 1) {
          resolve(true);
        }
      }
    });
  });
}

//addJob
exports.addJob = (user_id, job_name) => {
  return new Promise((resolve, reject) => {
    const sql =
      `
      UPDATE tbl_user SET job = ? WHERE id = ?
      `;
    pool.query(sql, [job_name, user_id], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        if (rows.affectedRows === 1) {
          resolve(true);
        }
      }
    });
  });
}

//addFavoriteTopic

exports.addFavoriteTopic = (user_id, topic_name) => {
  return new Promise((resolve, reject) => {
    const sql =
      `
      UPDATE tbl_user SET favorite_topic = ? WHERE id = ?
      `;
    pool.query(sql, [topic_name, user_id], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        if (rows.affectedRows === 1) {
          resolve(true);
        }
      }
    });
  });
}

exports.getFavoriteArray = (user_id) => {
  return new Promise((resolve, reject) => {
    const sql =
      `
      SELECT favorite_topic FROM tbl_user WHERE id = ?
      `;
    pool.query(sql, user_id, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows[0]);
      }
    });
  });
}

exports.getFavoriteTopic = (topicArray) =>{
  return new Promise((resolve, reject) => {
    const pool = mysql.createPool({
      "host": "localhost",
      "port": 3306,
      "user": "root",
      "password": "",
      "database": "mirai_wp_db",
      "connectionLimit": 100
    });
    const sql =
      `
      SELECT
      ID as id,
      post_title as name,
      post_content as content,
      wp_terms.name as category,
      wp_postmeta.meta_value
      FROM
      wp_posts
      LEFT JOIN wp_term_relationships ON (wp_posts.ID = wp_term_relationships.object_id)
      LEFT JOIN wp_term_taxonomy ON (wp_term_relationships.term_taxonomy_id = wp_term_taxonomy.term_taxonomy_id)
      LEFT JOIN wp_terms ON (wp_terms.term_id = wp_term_taxonomy.term_id)
      LEFT JOIN wp_postmeta ON (wp_posts.id = wp_postmeta.post_id)
      WHERE
      post_status = 'publish'
      AND post_type = 'post'
      AND wp_postmeta.meta_key='_thumbnail_id'
      AND wp_terms.name in ` + topicArray.favorite_topic
      ;
    pool.query(sql, async(err, rows) => {
      if (err) {
        reject(err);
      } else {
        try {
          for (var i in rows){
            rows[i].thumbnail_url = await getThumbnailbyMetaValue(rows[i].meta_value);
          }
          resolve(rows); 
        } catch (error) {
          reject(error);
        }
      }
    });
  });
}

const getThumbnailbyMetaValue = (meta_value) =>{
  return new Promise((resolve, reject) => {
    const pool = mysql.createPool({
      "host": "localhost",
      "port": 3306,
      "user": "root",
      "password": "",
      "database": "mirai_wp_db",
      "connectionLimit": 100
    });
    console.log(meta_value);
    const sql =
      `
      SELECT
      guid
      FROM
      wp_posts
      WHERE
      ID = ?`;
    pool.query(sql, meta_value, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows[0].guid);
      }
    });
  });
}

exports.getFirebaseIDs = () => {
  return new Promise((resolve, reject) => {
    const sql =
          `
            select birth, device_id from tbl_user where device_id is not NULL AND daily_horoscope = 1
          `;
    const pool = require('../config/config').pool;
    
    pool.query(sql, async (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve (rows);
      }
    });
  });
}


// /**
//  * Sign Up
//  * @param: user_data = { user_id, password }
//  */
// exports.signUp = (user_data) => {
//   return new Promise((resolve, reject) => {
//       const sql =
//         `
//         INSERT INTO user SET ?
//         `;

//       pool.query(sql, user_data, (err, rows) => {
//         if (err) {
//           reject(err);
//         } else {
//           if (rows.affectedRows === 1) {
//             resolve(rows);
//           } else {
//             const _err = new Error("User Write Error");
//             reject(_err);
//           }
//         }
//       });
//     }
//   ).then((result) => {
//     return new Promise((resolve, reject) => {
//       const sql =
//         `
//         SELECT user_id
//         FROM user
//         WHERE id = ?
//         `;

//       pool.query(sql, [result.insertId], (err, rows) => {
//         if (err) {
//           reject(err);
//         } else {
//           resolve(rows);
//         }
//       });
//     });
//   });
// };

// /**
//  * Sign In
//  * @param: user_data = { user_id, password }
//  */
// exports.signIn = (user_data) => {
//   return new Promise((resolve, reject) => {
//     const sql =
//       `
//       SELECT user_id
//       FROM user
//       WHERE user_id = ? AND password = ?
//       `;

//     pool.query(sql, [user_data.user_id, user_data.password], (err, rows) => {
//       if (err) {
//         reject(err);
//       } else {
//         resolve({user_id: rows[0].user_id});
//       }
//     });
//   });
// };