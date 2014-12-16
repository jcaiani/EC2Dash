namespace EC2Dash.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class EC2Instance : DbMigration
    {
        public override void Up()
        {
            AlterColumn("dbo.EC2Instance", "State", c => c.String());
        }
        
        public override void Down()
        {
            AlterColumn("dbo.EC2Instance", "State", c => c.Int(nullable: false));
        }
    }
}
