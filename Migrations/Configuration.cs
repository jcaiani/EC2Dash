namespace EC2Dash.Migrations
{
using EC2Dash.Models;
using System;
using System.Data.Entity;
using System.Data.Entity.Migrations;
using System.Linq;

    internal sealed class Configuration : DbMigrationsConfiguration<EC2Dash.Models.EC2Context>
    {
        public Configuration()
        {
            AutomaticMigrationsEnabled = true;
        }

        protected override void Seed(EC2Dash.Models.EC2Context context)
        {
            /* Joe C.
             * Values for seeding the database (* denotes only using a subset of possible values):
             * 1.  Name: textfield EC2+random numbers
             * 2.  ID: whatever the db id is for this prototype
             * 3.  *Type: a handful of different type machines t2.medium, etc
             * 4.  state:
           
                      +--------+---------------+
                      |  Code  |     State     |
                      +--------+---------------+
                      |   0    |    pending    | 
                      |  1     |    running    |
                      |  2     | shutting-down | 
                      |  3     |  terminated   |
                      |  4     |   stopping    | 
                      |  5     |   stopped     |
                      +--------+---------------+
             * 5.  *AZ: ap-northeast-1, ap-southeast-1, ap-southeast-2, eu-central-1,eu-west-1, sa-east-1, us-east-1, etc.
             * 6.  public IP: 1.2.3.4
             * 7.  private IP: 1.2.3.4
             */

            var r = new Random();
            String[] types = new String[] { "t2.small", "t2.micro", "t2.medium", "g2.2xlarge", "m3.medium", "m3.large", "m3.xlarge", "c3.8xlarge" };
            String[] azs = new String[] { "ap-northeast-1", "ap-southeast-1", "ap-southeast-2", "eu-central-1", "eu-west-1", "sa-east-1", "us-east-1" };
            String[] states = new String[] { "running", "rebooting", "pending", "terminated", "stopping", "stopped", "shutting-down" };
            var items = Enumerable.Range(1, 50).Select(o => new EC2Dash.Models.EC2Instance
            {
                Name = "EC2" + r.Next(1000, 3000).ToString(),
                EC2Type = types[r.Next(0, 7)],
                State = states[r.Next(0, 6)],
                AZ = azs[r.Next(0, 7)],
                PublicIP = r.Next(1, 10).ToString() + "." + r.Next(1, 10).ToString() + "." + r.Next(0, 255).ToString() + "." + r.Next(0, 255),
                PrivateIP = r.Next(1, 10).ToString() + "." + r.Next(1, 10).ToString() + "." + r.Next(0, 255).ToString() + "." + r.Next(0, 255)
            }).ToArray();
            context.EC2Instance.AddOrUpdate(item => new { item.Name }, items);

        }
    }
}
