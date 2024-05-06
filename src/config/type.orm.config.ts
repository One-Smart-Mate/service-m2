import { TypeOrmModule } from '@nestjs/typeorm'

const typeOrmConfig = TypeOrmModule.forRoot({
      type: 'mysql',
      username: "m2prod",
      password: "Ra$$)__!!4RGNFQL%&$aaAAACC",
      port: parseInt("3306"),
      database: "m2_dev",
      host: "208.109.28.73",
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
      autoLoadEntities: true,
      extra: {
            connectionLimit: 1000
      }
})
console.log(process.env)
export default typeOrmConfig
