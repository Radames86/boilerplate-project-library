/*
*
*
*       Complete the API routing below
*       
*       
*/

'use strict';

const { ObjectId } = require('mongodb');

module.exports = function (app, db, connectPromise) {
  const ready = connectPromise || Promise.resolve();

  app.route('/api/books')
    .get(async function (req, res) {
      try {
        await ready;

        const books = await db.collection('books')
          .find({})
          .project({ title: 1, comments: 1, commentcount: 1 })
          .toArray();

          const normalized = books.map(function (b) {
            const commentsArray = Array.isArray(b.comments) ? b.comments : [];
            const count = (typeof b.commentcount === 'number') ? b.commentcount : commentsArray.length;

            return {
              _id: b._id,
              title: b.title,
              commentcount: count
            };
          });

        return res.json(normalized);
      } catch (err) {
        return res.status(500).json({ error: 'server error' });
      }
      //response will be array of book objects
      //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
    })

    .post(async function (req, res) {
      try {
        await ready;

        const title = req.body.title;

        if (!title) {
          return res.send('missing required field title');
        }

        const newBook = {
          title: title,
          comments: [],
        };

        const result = await db.collection('books').insertOne(newBook);

        return res.json({
          _id: result.insertedId,
          title: newBook.title,
        });
      } catch (err) {
        return res.status(500).json({ error: 'server error' });
      }

      //response will contain new book object including atleast _id and title
    })

    .delete(async function (req, res) {
      try {
        await ready;

        await db.collection('books').deleteMany({});
        return res.send('complete delete successful');
      } catch (err) {
        return res.status(500).json({ error: 'server error' })
      }
      //if successful response will be 'complete delete successful'
    });



  app.route('/api/books/:id')
    .get(async function (req, res) {
      try {
        await ready;

        let bookId;
        try {
          bookId = new ObjectId(req.params.id);
        } catch (e) {
          return res.send('no book exists');
        }

        const book = await db.collection('books').findOne({ _id: bookId });

        if (!book) {
          return res.send('no book exists');
        }

        if (!Array.isArray(book.comments)) {
          book.comments = [];
        }

        return res.json(book);
      } catch (err) {
        return res.status(500).json({ error: 'server error' });
      }

      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
    })

    .post(async function (req, res) {
      try {
        await ready;

        const comment = req.body.comment;

        if (!comment) {
          return res.send('missing required field comment');
        }

        let bookId;
        try {
          bookId = new ObjectId(req.params.id);
        } catch (e) {
          return res.send('no book exists');
        }

        const updated = await db.collection('books').findOneAndUpdate(
          { _id: bookId },
          { $push: { comments: comment } },
          { returnDocument: 'after' }
        );

        const updatedDoc = (updated && updated.value) ? updated.value : updated;

        if (!updatedDoc) {
          return res.send('no book exists')
        }

        if (!Array.isArray(updatedDoc.comments)) {
          updated.value.comments = [];
        }

        return res.json(updatedDoc)
      } catch (err) {
        return res.status(500).json({ error: 'server error' });
      }
      //json res format same as .get
    })

    .delete(async function (req, res) {
      try {
        await ready;

        let bookId;
        try {
          bookId = new ObjectId(req.params.id);
        } catch (e) {
          return res.send('no book exists');
        }

        const result = await db.collection('books').deleteOne({ _id: bookId });

        if (!result || result.deletedCount === 0) {
          return res.send('no book exists');
        }

        return res.send('delete successful');
      } catch (err) {
        return res.status(500).json({ error: 'server error' });
      }
      //if successful response will be 'delete successful'
    });

};
