using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web;
using System.Web.Http;
using EC2Dash.Models;

namespace EC2Dash.Controllers
{
    public class EC2Controller : ApiController
    {
        private EC2Context db = new EC2Context();

        public IEnumerable<EC2Instance> GetEC2Items(string q = null, string sort = null, bool desc = false,
                                                        int? limit = null, int offset = 0, string ids = null)
        {
            var list = ((IObjectContextAdapter)db).ObjectContext.CreateObjectSet<EC2Instance>();

            IQueryable<EC2Instance> items = string.IsNullOrEmpty(sort) ? list.OrderBy(o => o.Name)
                : list.OrderBy(String.Format("it.{0} {1}", sort, desc ? "DESC" : "ASC"));
            if (!string.IsNullOrEmpty(q) && q != "undefined") {
                IQueryable<EC2Instance> nameMatches = null;
                //When we search, lets just search all columns to make things easier.
                nameMatches = items.Where(t => t.Name.Contains(q) || t.EC2Type.Contains(q) || t.State.Contains(q) || t.AZ.Contains(q) || t.PublicIP.Contains(q) || t.PrivateIP.Contains(q));

                items = nameMatches;
            }
            /*
             * This is added to the get the list of ids in a group.
             */
            if (!string.IsNullOrEmpty(ids) && ids != "undefined")
            {
                String[] idList = ids.Split(',');
                IQueryable<EC2Instance> listWithIds = null;
                for (int i = 0; i < idList.Length; i++)
                {
                    var tempId = int.Parse(idList[i]);
                    if (listWithIds == null)
                    {
                        listWithIds = items.Where(t => t.ID.Equals(tempId));
                    }
                    else
                    {
                        listWithIds = listWithIds.Concat(items.Where(t => t.ID.Equals(tempId)));
                    }
                }
                items = listWithIds;
            }

            if (offset > 0) items = items.Skip(offset);
            if (limit.HasValue) items = items.Take(limit.Value);
            return items;
        }

        // GET api/EC2/5
        public EC2Instance GetEC2Instance(int id)
        {
            EC2Instance ec2instance = db.EC2Instance.Find(id);
            if (ec2instance == null)
            {
                throw new HttpResponseException(Request.CreateResponse(HttpStatusCode.NotFound));
            }

            return ec2instance;
        }

        // PUT api/EC2/5
        public HttpResponseMessage PutEC2Instance(int id, EC2Instance ec2instance)
        {
            if (!ModelState.IsValid)
            {
                return Request.CreateErrorResponse(HttpStatusCode.BadRequest, ModelState);
            }

            if (id != ec2instance.ID)
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }

            db.Entry(ec2instance).State = EntityState.Modified;

            try
            {
                db.SaveChanges();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                return Request.CreateErrorResponse(HttpStatusCode.NotFound, ex);
            }

            return Request.CreateResponse(HttpStatusCode.OK);
        }

        // POST api/EC2
        public HttpResponseMessage PostEC2Instance(EC2Instance ec2instance)
        {
            if (ModelState.IsValid)
            {
                db.EC2Instance.Add(ec2instance);
                db.SaveChanges();

                HttpResponseMessage response = Request.CreateResponse(HttpStatusCode.Created, ec2instance);
                response.Headers.Location = new Uri(Url.Link("DefaultApi", new { id = ec2instance.ID }));
                return response;
            }
            else
            {
                return Request.CreateErrorResponse(HttpStatusCode.BadRequest, ModelState);
            }
        }

        // DELETE api/EC2/5
        public HttpResponseMessage DeleteEC2Instance(int id)
        {
            EC2Instance ec2instance = db.EC2Instance.Find(id);
            if (ec2instance == null)
            {
                return Request.CreateResponse(HttpStatusCode.NotFound);
            }

            db.EC2Instance.Remove(ec2instance);

            try
            {
                db.SaveChanges();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                return Request.CreateErrorResponse(HttpStatusCode.NotFound, ex);
            }

            return Request.CreateResponse(HttpStatusCode.OK, ec2instance);
        }

        protected override void Dispose(bool disposing)
        {
            db.Dispose();
            base.Dispose(disposing);
        }
    }
}